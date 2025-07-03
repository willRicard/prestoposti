import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useQueue } from "../client/hooks";

import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { DateTime, Duration } from "luxon";

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

  const [partySize, setPartySize] = useState(DEFAULT_PARTY_SIZE);

  const [countdownDate, setCountdownDate] = useState<DateTime>(DateTime.now());
  const [countdownText, setCountdownText] = useState("");
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout>(0);

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
            setPartySize(partySize);
          }
        } else if (message.type === "checkin") {
          setDisabled(true);
          setCountdownDate(
            DateTime.fromISO((message.checkInDate ?? "") as string) // serialization turns Date to ISO string
              .plus({
                milliseconds: partySize * SERVICE_TIME,
              }),
          );
          setShowCountdown(true);
        }
      } catch {}
    });
  }, [token]);

  // Update countdown display
  useEffect(() => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    const updateText = () => {
      const duration = countdownDate.diff(DateTime.now());
      if (duration.toMillis() < 0) {
        clearInterval(countdownInterval);
        return;
      }
      setCountdownText(duration.toFormat("mm:ss"));
    };

    updateText();
    setCountdownInterval(setInterval(updateText, 1000));
  }, [countdownDate, showCountdown, partySize]);

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
        <Typography variant="h1">{countdownText}</Typography>
      ) : (
        ""
      )}
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
