import { useState, useCallback, useEffect, useMemo } from "react";

import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { NumberField } from "@base-ui-components/react/number-field";

import {
  SEAT_CAPACITY,
  MIN_PARTY_SIZE,
  DEFAULT_PARTY_SIZE,
  type QueueItemData,
} from "../lib/constants.ts";

import styles from "./queue_form.module.css";

export default function QueueForm({
  onSubmit,
}: {
  onSubmit?: (queueItem: QueueItemData) => void;
}) {
  const [name, setName] = useState("");
  const [partySize, setPartySize] = useState<number>(DEFAULT_PARTY_SIZE);

  const disabled = useMemo(() => name === "", [name]);

  // Warn on empty name
  const [inputIsError, setInputIsError] = useState(false);
  useEffect(() => {
    setInputIsError(disabled);
  }, [name]);
  // Don't show error before edits
  useEffect(() => {
    setInputIsError(false);
  }, []);

  // Load saved form values from local storage.
  useEffect(() => {
    const storedName = localStorage.getItem("pp-name");
    if (storedName !== null) {
      setName(storedName);
    }
  });

  const validateAndSubmit = useCallback(() => {
    if (disabled) {
      return;
    }
    if (onSubmit) {
      onSubmit({ name, partySize });
    }
  }, [name, partySize]);

  return (
    <>
      <Typography variant="h2">Hello</Typography>
      <Typography variant="body1">
        Welcome to Waitlist Manager, please input your details to join the
        queue.
      </Typography>
      <TextField
        required
        error={inputIsError}
        helperText={inputIsError ? "Required" : ""}
        id="name"
        label="Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => setInputIsError(disabled)}
      />
      <NumberField.Root
        id="party-size"
        defaultValue={DEFAULT_PARTY_SIZE}
        min={MIN_PARTY_SIZE}
        max={SEAT_CAPACITY}
        className={styles.Field}
        value={partySize}
        onValueChange={(value) => setPartySize(value ?? DEFAULT_PARTY_SIZE)}
      >
        <NumberField.ScrubArea className={styles.ScrubArea}>
          <label htmlFor="toto" className={styles.Label}>
            Party Size
          </label>
        </NumberField.ScrubArea>
        <NumberField.Group className={styles.Group}>
          <NumberField.Decrement className={styles.Decrement}>
            -
          </NumberField.Decrement>
          <NumberField.Input id="toto" className={styles.Input} />
          <NumberField.Increment className={styles.Increment}>
            +
          </NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
      <Button
        variant="contained"
        onClick={validateAndSubmit}
        disabled={disabled}
      >
        Join
      </Button>
    </>
  );
}
