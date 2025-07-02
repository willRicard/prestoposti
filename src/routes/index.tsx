import { createFileRoute } from "@tanstack/react-router";

import App from "../app.tsx";

export const Route = createFileRoute("/")({
  component: App,
});
