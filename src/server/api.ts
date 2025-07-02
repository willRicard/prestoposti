import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import z from "zod";

import {
  MIN_PARTY_SIZE,
  SEAT_CAPACITY,
  type QueueItemData,
} from "../lib/constants.ts";
import { queueAppend } from "./database.ts";

const app = new Hono();

app.post(
  "/queue",
  zValidator(
    "json",
    z.object({
      // name not empty
      name: z.string().min(1),
      // MIN_PARTY_SIZE <= partySize <= SEAT_CAPACITY
      partySize: z.number().gte(MIN_PARTY_SIZE).lte(SEAT_CAPACITY),
    }),
    (result, c) => {
      if (!result.success) {
        return c.text("ERR", 400);
      }
    },
  ),
  async (c) => {
    const { name, partySize } = c.req.valid("json") as QueueItemData;
    const { id, eta } = await queueAppend({ name, partySize });
    if (id === "") {
      return c.text("ERR", 500);
    }
    return c.json({ id, eta });
  },
);

export default app;
