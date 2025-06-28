import { Hono } from "hono";
import type { FC } from "hono/jsx";

const app = new Hono();

const Layout: FC = (props) => {
  return (
    <html>
      <body>{props.children}</body>
    </html>
  );
};

const Top: FC<{ messages: string[] }> = (props: { messages: string[] }) => {
  return (
    <Layout>
      <h1>Hello Hono</h1>
      <ul>
        {props.messages.map((message) => (
          <li>{message}</li>
        ))}
      </ul>
    </Layout>
  );
};

app.get("/", (c) => {
  const messages = ["Good morning", "bye"];
  return c.html(<Top messages={messages} />);
});

export default app;
