import { Hono } from "hono";
import { renderToString } from "react-dom/server";

const app = new Hono();

app.get("/", (c) => {
  return c.html(
    renderToString(
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta content="width=device-width, initial-scale=1" name="viewport" />
        </head>
        <script type="module" src="/src/client.tsx" />
        <body>
          <div id="root" />
        </body>
      </html>,
    ),
  );
});

export default app;
