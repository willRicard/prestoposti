"use server";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import z from "zod";

import { jwt } from "hono/jwt";
import { SignJWT } from "jose";

import {
  MIN_PARTY_SIZE,
  SEAT_CAPACITY,
  QUEUE_TOKEN_ALG,
  QUEUE_TOKEN_LIFETIME,
  type QueueItemData,
} from "../lib/constants.ts";
import { queueAppend } from "./database.ts";

const secretKey = process.env.JWT_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

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

    // Issue JWT to manage queue entry for some time:
    const token = await new SignJWT({ id })
      .setProtectedHeader({ alg: QUEUE_TOKEN_ALG })
      .setIssuedAt()
      .setExpirationTime(QUEUE_TOKEN_LIFETIME)
      .sign(encodedKey);

    return c.json({ token, eta });
  },
);

app.use("/queue/*", jwt({ secret: process.env.JWT_SECRET ?? "" }));

app.get("/queue/check", (c) => {
  const payload = c.get("jwtPayload");
  return c.text("Hello");
});

export default app;
