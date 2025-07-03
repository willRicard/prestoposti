import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueue } from "../client/hooks";

import Button from "@mui/material/Button";
import { DateTime } from "luxon";
import Countdown from "./countdown.tsx";

import { hc } from "hono/client";
import app from "../index.tsx";
import { type WSMessageReceive } from "hono/ws";
import {
  SERVICE_TIME,
  DEFAULT_PARTY_SIZE,
  type PrestoPostiMessage,
  type PrestoPostiTokenMessage,
  type PrestoPostiCheckInMessage,
} from "../lib/constants.ts";

let ws: WebSocket | null = null;

export default function QueueView() {
  const [disabled, setDisabled] = useState(true);

  const [countdownDate, setCountdownDate] = useState<DateTime>(DateTime.now());
  const [showCountdown, setShowCountdown] = useState(false);
  const [done, setDone] = useState(false);

  const { token, deleteToken } = useQueue();
  const navigate = useNavigate({ from: "/queue" });

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
          const { eligible } = message;
          if (eligible) {
            setDisabled(false);
          }
        } else if (message.type === "checkin") {
          setDisabled(true);
          setCountdownDate(
            DateTime.fromISO((message.checkInDate ?? "") as string) // serialization turns Date to ISO string
              .plus({
                milliseconds: (message.partySize ?? 0) * SERVICE_TIME,
              }),
          );
          setShowCountdown(true);
        } else if (message.type === "checkout") {
          setDisabled(true);
          setCountdownDate(DateTime.now().minus({ minutes: 1 }));
          setShowCountdown(true);
          localStorage.removeItem("pp-token");
        }
      } catch {}
    });
    ws.addEventListener("close", () => {
      localStorage.removeItem("pp-token");
      navigate({ to: "/" });
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
      {showCountdown ? (
        <Countdown until={countdownDate} onDone={() => setDone(true)} />
      ) : (
        ""
      )}
      {done ? <p>Thank you! Please proceed to your payment</p> : ""}
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
