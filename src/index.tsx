import { Hono } from "hono";
import { serveStatic } from "hono/bun";

import { renderToReadableStream } from "react-dom/server.browser";

import App from "./app.tsx";

const app = new Hono();

app
  .use(
    "/assets/*",
    serveStatic({
      root: "./dist",
    }),
  )
  .get("/", async (c) => {
    let manifest = {};
    if (process.env.NODE_ENV === "production") {
      manifest = await import("../dist/.vite/manifest.json");
    }
    const stream = await renderToReadableStream(
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta content="width=device-width, initial-scale=1" name="viewport" />
          <title>PrestoPosti</title>
        </head>
        <body>
          <App />
        </body>
      </html>,
      {
        // Load compiled entry script if applicable
        bootstrapScripts: [
          process.env.NODE_ENV === "production"
            ? manifest["src/client.tsx"].file
            : "/src/client.tsx",
        ],
      },
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
