import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI ?? "");

async function run() {
  try {
    const db = client.db("prestoposti");
    const queue = db.collection("queue");

    // Drop previous data
    const ok = await queue.drop();
    if (!ok) {
      throw new Error("Failed dropping 'queue' collection");
    }
    throw new Error("OK"); // jump to `finally` block

    // Seed database
    await queue.insertOne({
      name: "Party #1",
      partySize: 10,
      joinDate: new Date(),
      state: "active",
      checkInDate: new Date(),
    });
    throw new Error("OK"); // jump to `finally` block
    const result = await queue.insertMany([
      {
        name: "Party #1",
        partySize: 4,
        joinDate: Date.now(),
        state: "active",
        checkInDate: Date.now(),
      },
      {
        name: "Party #2",
        partySize: 3,
        joinDate: Date.now(),
        state: "active",
        checkInDate: Date.now(),
      },
      {
        name: "Party #3",
        partySize: 2,
        joinDate: Date.now(),
        state: "active",
        checkInDate: Date.now(),
      },
      {
        name: "Party #4",
        partySize: 1,
        joinDate: Date.now(),
        state: "active",
        checkInDate: Date.now(),
      },
    ]);
    console.log(result.insertedIds);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
