import { Hono } from "hono";
import { serveStatic } from "hono/bun";

import { renderToString } from "react-dom/server";

const app = new Hono();

app
  .use(
    "/assets/*",
    serveStatic({
      root: "./dist",
    }),
  )
  .get("/", (c) => {
    return c.html(
      renderToString(
        <html lang="en">
          <head>
            <meta charSet="utf-8" />
            <meta
              content="width=device-width, initial-scale=1"
              name="viewport"
            />
            <title>PrestoPosti</title>
            <script type="module" src="/src/client.tsx" />
          </head>
          <body>
            <div id="root" />
          </body>
        </html>,
      ),
    );
  });

export default app;
