"use server";
import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { zValidator } from "@hono/zod-validator";
import z from "zod";

import { jwt } from "hono/jwt";
import { SignJWT, jwtVerify } from "jose";

import {
  SERVICE_TIME,
  MIN_PARTY_SIZE,
  SEAT_CAPACITY,
  QUEUE_TOKEN_ALG,
  QUEUE_TOKEN_LIFETIME,
  type QueueItemData,
} from "../lib/constants.ts";
import { queueAppend, queueTick } from "./database.ts";
import { type WSContext } from "hono/ws";

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
 */
const WS_CLOSED = 3;

const secretKey = process.env.JWT_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export const { websocket, upgradeWebSocket } = createBunWebSocket();

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

const wsMap = new Map<string, WSContext<unknown>>();
let wsInterval: NodeJS.Timeout;

async function tick() {
  const { checkedOut, eligible } = await queueTick();

  // Notify leaving parties of check out date
  for (const leavingParty of checkedOut) {
    wsMap.get(leavingParty._id.toString())?.send(
      JSON.stringify({
        type: "checkout",
        checkOutDate: leavingParty.checkOutDate,
      }),
    );
  }

  // Notify eligible parties to enable check in button
  for (const eligibleParty of eligible) {
    wsMap.get(eligibleParty._id.toString())?.send(
      JSON.stringify({
        type: "eligibility",
        partySize: eligibleParty.partySize,
        eligible: true,
      }),
    );
  }
}

app.get(
  "/ws",
  upgradeWebSocket(() => {
    return {
      async onMessage(event, ws) {
        try {
          const { token } = JSON.parse(event.data.toString());

          const { payload } = await jwtVerify(token, encodedKey, {
            algorithms: [QUEUE_TOKEN_ALG],
          });

          if (typeof payload.id !== "string") {
            throw new Error("JWT does not refer to queue item");
          }
          wsMap.set(payload.id, ws);
          if (!wsInterval) {
            wsInterval = setInterval(tick, SERVICE_TIME);
          }
        } catch (err) {
          ws.close();
        }
      },
      onClose: (_, ws) => {
        // Clear any closed WebSockets
        wsMap.forEach((value, key) => {
          if (value.readyState === WS_CLOSED) {
            wsMap.delete(key);
          }
        });
      },
    };
  }),
);

export default app;
