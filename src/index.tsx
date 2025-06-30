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
    const stream = await renderToReadableStream(
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta content="width=device-width, initial-scale=1" name="viewport" />
          <title>PrestoPosti</title>
          <script type="module" src="/src/client.tsx" />
        </head>
        <body>
          <App />
        </body>
      </html>,
    );
    return c.body(stream, {
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "Transfer-Encoding": "chunked",
      },
    });
  });

export default app;
