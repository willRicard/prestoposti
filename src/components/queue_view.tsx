import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useQueue } from "../client/hooks";

import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { hc } from "hono/client";
import app from "../index.tsx";
import { type WSMessageReceive } from "hono/ws";
import {
  type PrestoPostiMessage,
  type PrestoPostiTokenMessage,
  type PrestoPostiCheckInMessage,
} from "../lib/constants.ts";

let ws: WebSocket | null = null;

export default function QueueView() {
  const [disabled, setDisabled] = useState(true);
  const [showCountdown, setShowCountdown] = useState(false);

  const { token, deleteToken } = useQueue();

  useEffect(() => {
    if (!token || token === "") {
      return;
    }

    const client = hc<typeof app.app>("ws://localhost:3000/api");
    // @ts-expect-error
    ws = client.ws.$ws(0);
    if (!ws) {
      return;
    }
    ws.addEventListener("open", () => {
      const message: PrestoPostiTokenMessage = {
        type: "token",
        token,
      };
      ws.send(JSON.stringify(message));
    });
    ws.addEventListener("message", (event: MessageEvent<WSMessageReceive>) => {
      try {
        const message = JSON.parse(event.data.toString()) as PrestoPostiMessage;
        if (message.type === "eligibility") {
          const { partySize, eligible } = message;
          if (eligible) {
            setDisabled(false);
          }
        } else if (message.type === "checkin") {
          setDisabled(true);
          setShowCountdown(true);
        }
      } catch {}
    });
  }, [token]);

  const handleClick = useCallback(() => {
    if (!ws) {
      return;
    }

    const message: PrestoPostiCheckInMessage = {
      type: "checkin",
      token: token,
    };

    ws.send(JSON.stringify(message));
  }, [token]);

  return (
    <div className="flex flex-col gap-9">
      <h2>Thank you for your patience</h2>
      <Link to="/" onClick={deleteToken} className="underline">
        Cancel and go back
      </Link>
      {showCountdown ? <Typography>Service has started</Typography> : ""}
      <Button
        variant="contained"
        color="success"
        onClick={handleClick}
        disabled={disabled}
      >
        Check in
      </Button>
    </div>
  );
}
