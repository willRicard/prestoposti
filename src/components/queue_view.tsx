import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQueue } from "../client/hooks";

import Button from "@mui/material/Button";

import { hc } from "hono/client";
import app from "../index.tsx";

export default function QueueView() {
  const [disabled, setDisabled] = useState(true);

  const { token, deleteToken } = useQueue();

  useEffect(() => {
    if (!token || token === "") {
      return;
    }

    const client = hc<typeof app.app>("ws://localhost:3000/api");
    const ws = client.ws.$ws(0);
    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({ token }));
    });
  }, [token]);

  return (
    <div className="flex flex-col gap-9">
      <h2>Thank you for your patience</h2>
      <Link to="/" onClick={deleteToken} className="underline">
        Cancel and go back
      </Link>
      <Button variant="contained" color="success" disabled={disabled}>
        Check in
      </Button>
    </div>
  );
}
