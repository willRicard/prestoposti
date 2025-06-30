import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { NumberField } from "@base-ui-components/react/number-field";

export default function QueueForm() {
  return (
    <>
      <Typography variant="h2">Hello</Typography>
      <Typography variant="body1">
        Welcome to Waitlist Manager, please input your details to join the
        queue.
      </Typography>
      <TextField label="Name" variant="standard" />
      <NumberField.Root id="party-size" defaultValue={2} min={1} max={10}>
        <NumberField.ScrubArea>
          <label>Party Size</label>
        </NumberField.ScrubArea>
        <NumberField.Group>
          <NumberField.Decrement>-</NumberField.Decrement>
          <NumberField.Input style={{ textAlign: "center" }} />
          <NumberField.Increment>+</NumberField.Increment>
        </NumberField.Group>
      </NumberField.Root>
      <Button variant="contained" onClick={() => alert("ok")}>
        Join
      </Button>
    </>
  );
}
