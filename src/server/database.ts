"use server";
import { MongoClient, ObjectId, type WithId } from "mongodb";

import {
  SEAT_CAPACITY,
  SERVICE_TIME,
  type ServerQueueItemData,
  type QueueItemData,
} from "../lib/constants.ts";

let client: MongoClient;

function initClient() {
  client = new MongoClient(process.env.MONGO_URI ?? "");
}

/**
 * Append one queue item in the waiting state or immediately active if there are
 * enough seats.
 *
 * @param item Waiting party details.
 * @returns Created queue item identifier and ETA in milliseconds.
 */
export async function queueAppend(
  item: QueueItemData,
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
      state: "waiting",
      joinDate: new Date(),
    };

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

/**
 * Check out any parties whose service time has elapsed.
 *
 * @returns Checked out and eligible parties.
 */
export async function queueTick(): Promise<{
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
              new Date(), // requires an ISODate server-side
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
            partySize: { $lt: availableSeats },
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
    }

    await session.commitTransaction();
    return { checkedOut, eligible };
  } catch {
    await session.abortTransaction();
  } finally {
    session.endSession();
  }
  return { checkedOut: [], eligible: [] };
}

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
