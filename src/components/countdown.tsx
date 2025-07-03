import { useState, useEffect, useCallback } from "react";
import { DateTime } from "luxon";

import Typography from "@mui/material/Typography";

export default function Countdown({ until }: { until: DateTime }) {
  const [text, setText] = useState("");
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout>();

  const updateText = useCallback(() => {
    const duration = until.diff(DateTime.now());
    if (duration.toMillis() < 0) {
      clearInterval(intervalId);
      return;
    }
    setText(duration.toFormat("mm:ss"));
  }, [until]);

  // Update countdown display
  useEffect(() => {
    console.log(until.toISO());
    if (intervalId) {
      clearInterval(intervalId);
    }
    updateText();
    setIntervalId(setInterval(updateText, 1000));
  }, [until]);

  return <Typography variant="h1">{text}</Typography>;
}
