import { Hono } from "hono";
import { serveStatic } from "hono/bun";

import { renderToReadableStream } from "react-dom/server.browser";
import { RouterProvider } from "@tanstack/react-router";

import router from "./router.ts";

import apiRoutes from "./server/api.ts";

const app = new Hono();

app
  .use(
    "/assets/*",
    serveStatic({
      root: "./dist",
    }),
  )
  .route("/api", apiRoutes)
  .get("/*", async (c) => {
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
          <RouterProvider router={router} />
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
