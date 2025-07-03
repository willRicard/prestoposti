"use server";
import { MongoClient, type WithId } from "mongodb";

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

    // TODO(gricard): Check out any overdue guests

    const occupancyAgg = queue.aggregate(
      [
        {
          $match: {
            state: "active",
          },
        },
        { $group: { _id: null, occupancy: { $sum: "$partySize" } } },
      ],
      { session },
    );
    const aggResult = await occupancyAgg.tryNext();
    const occupancy: number = aggResult ? aggResult.occupancy : 0;

      const result = await queue.insertOne(serverItem, { session });

      await session.commitTransaction();
      return { id: result.insertedId.toString(), eta: 0 };
    }

    // Otherwise create in "waiting" state
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
 * @returns Checked out parties.
 */
export async function queueTick(): Promise<{
  checkedOut: WithId<ServerQueueItemData>[];
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
      console.log(`Party ${JSON.stringify(result)} checks out`);
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

    await session.commitTransaction();
    return { checkedOut };
  } catch {
    await session.abortTransaction();
  } finally {
    session.endSession();
  }
  return { checkedOut: [] };
}
