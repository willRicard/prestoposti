import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { zValidator } from "@hono/zod-validator";
import z from "zod";

import { renderToReadableStream } from "react-dom/server.browser";

import App from "./app.tsx";

import {
  MIN_PARTY_SIZE,
  SEAT_CAPACITY,
  type QueueItemData,
} from "./lib/constants.ts";

const app = new Hono();

app
  .use(
    "/assets/*",
    serveStatic({
      root: "./dist",
    }),
  )
  .post(
    "/api/queue",
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
      // TODO(gricard): Add queue record to MongoDB
      return c.json({ status: "pending" });
    },
  )
  .get("/", async (c) => {
    const isProduction = process.env.NODE_ENV === "production";
    let manifest = {};
    if (isProduction) {
      manifest = await import("../dist/.vite/manifest.json");
    }
    const stream = await renderToReadableStream(
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta content="width=device-width, initial-scale=1" name="viewport" />
          <title>PrestoPosti</title>
          {isProduction ? (
            // Fetch bundled production styles
            <>
              <link rel="stylesheet" href={manifest["src/client.tsx"].css} />
              <link rel="stylesheet" href="/assets/index.css" />
            </>
          ) : (
            // Load development script otherwise
            // cannot use `bootstrapScripts` as type="module" is required
            <script type="module" src="/src/client.tsx" />
          )}
        </head>
        <body>
          <App />
        </body>
      </html>,
      isProduction
        ? {
            // Load compiled entry script if applicable
            bootstrapScripts: [manifest["src/client.tsx"].file],
          }
        : {},
    );
    return c.body(stream, {
      // Enable support for Web Streams
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "Transfer-Encoding": "chunked",
      },
    });
  });

export default app;
