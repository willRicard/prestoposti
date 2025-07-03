"use server";
import {
  MongoClient,
  ObjectId,
  type AggregationCursor,
  type ClientSession,
  type WithId,
} from "mongodb";

import {
  SEAT_CAPACITY,
  SERVICE_TIME,
  type ServerQueueItemData,
  type QueueItemData,
} from "../lib/constants.ts";

let client: MongoClient;

export function initClient(uri?: string) {
  const envUri = process.env.MONGO_URI ?? "";
  client = new MongoClient(uri ? uri : envUri);
}

/**
 * Append one queue item in the waiting state or immediately active if there are
 * enough seats.
 *
 * @param item Waiting party details.
 * @param state Optional queue item state override.
 * @returns Created queue item identifier and ETA in milliseconds.
 */
export async function queueAppend(
  item: QueueItemData,
  state?: "active" | "done", // "waiting" is default
): Promise<{ id: string; eta: number }> {
  if (!client) {
    initClient();
  }

  const session = client.startSession();

  try {
    session.startTransaction();
    const queue = client.db("prestoposti").collection("queue");

    const serverItem: ServerQueueItemData = {
      name: item.name,
      partySize: item.partySize,
      state: state ? state : "waiting",
      joinDate: new Date(),
    };
    if (state === "active") {
      serverItem.checkInDate = new Date();
    }

    const result = await queue.insertOne(serverItem, { session });
    const id = result.insertedId.toString();

    await session.commitTransaction();
    return {
      id,
      eta: item.partySize * SERVICE_TIME, // wait for equal number of guests to finish
    };
  } catch (error) {
    await session.abortTransaction();
  } finally {
    await session.endSession();
  }
  return { id: "", eta: -1 };
}

export async function queueGet(state?: string): Promise<ServerQueueItemData[]> {
  if (!client) {
    initClient();
  }
  const findResult = client
    .db("prestoposti")
    .collection("queue")
    .find(
      state // match supplied state or any
        ? {
            state,
          }
        : {},
    );
  const items: ServerQueueItemData[] = [];
  for await (const item of findResult) {
    items.push(item as WithId<ServerQueueItemData>);
  }
  return items;
}

export async function queueGetOne(
  id: string,
): Promise<WithId<ServerQueueItemData> | null> {
  if (!client) {
    initClient();
  }
  return (await client
    .db("prestoposti")
    .collection("queue")
    .findOne({ _id: new ObjectId(id) })) as WithId<ServerQueueItemData> | null;
}

export async function queueClear(): Promise<void> {
  if (!client) {
    initClient();
  }
  await client.db("prestoposti").collection("queue").deleteMany();
}

/**
 * Count available seats and compute eligible parties.
 * @param session Optional transaction session.
 */
async function _queueFindEligible(
  session?: ClientSession,
): Promise<WithId<ServerQueueItemData>[]> {
  if (!client) {
    initClient();
  }
  const queue = client.db("prestoposti").collection("queue");
  // Count available seats.
  const occupancyAgg = queue.aggregate(
    [
      {
        $match: {
          state: "active",
        },
      },
      {
        $group: { _id: null, occupancy: { $sum: "$partySize" } },
      },
    ],
    { session },
  );
  const aggResult = await occupancyAgg.tryNext();
  let availableSeats = aggResult
    ? SEAT_CAPACITY - aggResult.occupancy
    : SEAT_CAPACITY;

  // Find eligible parties ordered by join date.
  const eligible: WithId<ServerQueueItemData>[] = [];
  const eligibleAgg = queue.aggregate(
    [
      {
        $match: {
          state: "waiting",
          partySize: { $lte: availableSeats },
        },
      },
      {
        $sort: { joinDate: 1 },
      },
    ],
    { session },
  );
  let nextSeats = 0;
  for await (const item of eligibleAgg) {
    const party = item as WithId<ServerQueueItemData>;
    if (nextSeats + party.partySize > availableSeats) {
      break;
    }
    eligible.push(party);
    nextSeats += party.partySize;
    // Force single party eligibility for spec compliance
    break;
  }
  return eligible;
}

/**
 * Check out any parties whose service time has elapsed.
 *
 * @returns Checked out and eligible parties.
 */
export async function queueTick(targetTime: Date = new Date()): Promise<{
  checkedOut: WithId<ServerQueueItemData>[];
  eligible: WithId<ServerQueueItemData>[];
}> {
  if (!client) {
    initClient();
  }
  const session = client.startSession();
  try {
    session.startTransaction();

    const queue = client.db("prestoposti").collection("queue");

    // Match active parties whose checkInDate is older than
    // service time for all party members.
    const serviceTimeElapsedFilter = {
      state: "active",
      $expr: {
        $lt: [
          "$checkInDate",
          {
            $subtract: [
              targetTime, // requires an ISODate Mongo-server-side
              { $multiply: ["$partySize", SERVICE_TIME] },
            ],
          },
        ],
      },
    };

    // Fetch parties to checkout
    const checkedOut: WithId<ServerQueueItemData>[] = [];
    const checkOutResult = queue.find(serviceTimeElapsedFilter);
    for await (const result of checkOutResult) {
      checkedOut.push(result as WithId<ServerQueueItemData>);
    }

    // Perform update
    const checkOutUpdate = await queue.updateMany(
      serviceTimeElapsedFilter,
      {
        $set: { state: "done" },
        $currentDate: { checkOutDate: true },
      },
      { session },
    );
    if (checkOutUpdate.modifiedCount !== checkedOut.length) {
      throw new Error("Party check out count did not match");
    }

    const eligible = await _queueFindEligible(session);

    await session.commitTransaction();
    return { checkedOut, eligible };
  } catch {
    await session.abortTransaction();
  } finally {
    session.endSession();
  }
  return { checkedOut: [], eligible: [] };
}

/**
 * Perform item checkin checks and update state.
 *
 * @param id Queue item object id.
 * @returns Checked in queue item or null if invalid check in.
 */
export async function queueCheckIn(
  id: string,
): Promise<ServerQueueItemData | null> {
  if (!client) {
    initClient();
  }
  const session = client.startSession();
  try {
    session.startTransaction();

    const queue = client.db("prestoposti").collection("queue");

    // Supplied item must be eligible
    const eligible = await _queueFindEligible(session);
    let ok = false;
    for (const party of eligible) {
      if (party._id.toString() === id) {
        ok = true;
        break;
      }
    }
    if (!ok) {
      throw new Error("Ineligible check in");
    }

    const updateResult = await queue.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          state: "active",
        },
        $currentDate: { checkInDate: true },
      },
      { session },
    );
    if (updateResult.modifiedCount !== 1) {
      throw new Error("Database checkin failed");
    }

    const findResult = await queue.findOne({ _id: new ObjectId(id) });
    await session.commitTransaction();
    return findResult as ServerQueueItemData | null;
  } catch {
    await session.abortTransaction();
  } finally {
    await session.endSession();
  }
  return null;
}
