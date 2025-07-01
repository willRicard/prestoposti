import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { NumberField } from "@base-ui-components/react/number-field";

import styles from "./queue_form.module.css";

export default function QueueForm() {
  return (
    <>
      <Typography variant="h2">Hello</Typography>
      <Typography variant="body1">
        Welcome to Waitlist Manager, please input your details to join the
        queue.
      </Typography>
      <TextField label="Name" variant="standard" />
      <NumberField.Root
        id="party-size"
        defaultValue={2}
        min={1}
        max={10}
        className={styles.Field}
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
      <Button variant="contained" onClick={() => alert("ok")}>
        Join
      </Button>
    </>
  );
}
