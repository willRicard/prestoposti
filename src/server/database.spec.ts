import { test, expect, beforeAll, beforeEach, afterEach } from "bun:test";
import { MongoMemoryReplSet } from "mongodb-memory-server";

import { DateTime } from "luxon";

import * as database from "./database.ts";
import { SEAT_CAPACITY, SERVICE_TIME } from "../lib/constants.ts";

let replset: MongoMemoryReplSet;

beforeAll(async () => {
  replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
});

beforeEach(async () => {
  database.queueClear();
});

afterEach(async () => {
  database.queueClear();
});

test("append party to database queue", async () => {
  const uri = replset.getUri();

  database.initClient(uri);

  const { id, eta } = await database.queueAppend({
    name: "Party #1",
    partySize: 2,
  });

  expect(id).toHaveLength(24);
  expect(eta).toBeGreaterThan(0);

  const items = await database.queueGet();
  expect(items).toHaveLength(1);
  expect(items[0].name).toEqual("Party #1");
  expect(items[0].partySize).toEqual(2);
  expect(items[0].state).toEqual("waiting");
});

test("tick new parties ", async () => {
  await database.queueAppend({
    name: "Party #1",
    partySize: 4,
  });
  await database.queueAppend({
    name: "Party #2",
    partySize: 3,
  });
  await database.queueAppend({
    name: "Party #3",
    partySize: 2,
  });
  await database.queueAppend({
    name: "Party #4",
    partySize: 1,
  });
  // not eligible until all above parties finish
  await database.queueAppend({
    name: "Party #5",
    partySize: SEAT_CAPACITY,
  });

  // All above parties should be eligible
  const { checkedOut, eligible } = await database.queueTick();
  expect(checkedOut).toHaveLength(0);
  expect(eligible).toHaveLength(4);
});

test("tick old parties to checkout", async () => {
  // append in active state
  await database.queueAppend(
    {
      name: "Party #1",
      partySize: 4,
    },
    "active",
  );
  await database.queueAppend(
    {
      name: "Party #2",
      partySize: 3,
    },
    "active",
  );
  await database.queueAppend(
    {
      name: "Party #3",
      partySize: 2,
    },
    "active",
  );
  await database.queueAppend(
    {
      name: "Party #4",
      partySize: 1,
    },
    "active",
  );
  await database.queueAppend({
    name: "Party #5",
    partySize: 3,
  });

  // Tick queue one unit of service time.
  const { checkedOut, eligible } = await database.queueTick(
    DateTime.now().plus({ milliseconds: SERVICE_TIME }).toJSDate(),
  );
  expect(checkedOut).toHaveLength(1); // Party #1 should check out
  expect(eligible).toHaveLength(0); // parties are already active

  let doneParties = await database.queueGet("done");
  expect(doneParties).toHaveLength(1);

  // Tick queue three tunits of service time.
  const tick2 = await database.queueTick(
    DateTime.now()
      .plus({ milliseconds: 3 * SERVICE_TIME })
      .toJSDate(),
  );
  expect(tick2.checkedOut).toHaveLength(2); // two additional parties
  expect(tick2.eligible).toHaveLength(1); // Party #5 should now be eligible

  doneParties = await database.queueGet("done");
  expect(doneParties).toHaveLength(3);
});

test("tick large party", async () => {
  await database.queueAppend(
    {
      name: "Party #1",
      partySize: 4,
    },
    "active",
  );
  await database.queueAppend(
    {
      name: "Party #2",
      partySize: 3,
    },
    "active",
  );
  await database.queueAppend(
    {
      name: "Party #3",
      partySize: 2,
    },
    "active",
  );
  await database.queueAppend(
    {
      name: "Party #4",
      partySize: 1,
    },
    "active",
  );

  await database.queueAppend({
    name: "Party #5",
    partySize: SEAT_CAPACITY,
  });

  const { checkedOut, eligible } = await database.queueTick(
    DateTime.now()
      .plus({ milliseconds: SEAT_CAPACITY * SERVICE_TIME })
      .toJSDate(),
  );

  expect(checkedOut).toHaveLength(4);
  expect(eligible).toHaveLength(1);
});

test("check in order", async () => {
  let ids = [];
  ids.push(
    (
      await database.queueAppend({
        name: "Party #1",
        partySize: 4,
      })
    ).id,
  );
  ids.push(
    (
      await database.queueAppend({
        name: "Party #2",
        partySize: 3,
      })
    ).id,
  );
  ids.push(
    (
      await database.queueAppend({
        name: "Party #3",
        partySize: 2,
      })
    ).id,
  );
  ids.push(
    (
      await database.queueAppend({
        name: "Party #4",
        partySize: 1,
      })
    ).id,
  );
  // not eligible until all above parties finish
  ids.push(
    (
      await database.queueAppend({
        name: "Party #5",
        partySize: SEAT_CAPACITY,
      })
    ).id,
  );

  const checkedIn = await database.queueCheckIn(ids[0]);
  expect(checkedIn).not.toBeNull();

  const activeParties = await database.queueGet("active");
  expect(activeParties).toHaveLength(1);
  expect(activeParties[0].name).toEqual("Party #1");
  expect(activeParties[0].checkInDate).toBeDate();

  // Party #3 cannot check in before Party #2
  //const tooEarlyCheckIn = await database.queueCheckIn(ids[2]);
  //expect(tooEarlyCheckIn).toBeNull();

  // Party #5 cannot check in as it not eligible
  const ineligibleCheckIn = await database.queueCheckIn(ids[4]);
  expect(ineligibleCheckIn).toBeNull();
});
