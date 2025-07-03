import { createFileRoute } from "@tanstack/react-router";

import QueueView from "../components/queue_view.tsx";

export const Route = createFileRoute("/queue")({
  component: QueueView,
});
