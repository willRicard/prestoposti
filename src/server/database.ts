import { MongoClient } from "mongodb";

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

    // If there are enough seats already,
    // accept the new party immediately
    if (occupancy + item.partySize <= SEAT_CAPACITY) {
      const serverItem: ServerQueueItemData = {
        name: item.name,
        partySize: item.partySize,
        state: "active",
        joinDate: new Date(),
        checkInDate: new Date(),
      };

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
