import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQueue } from "../client/hooks";

import Button from "@mui/material/Button";

export default function QueueView() {
  const [disabled, setDisabled] = useState(true);

  const { token, deleteToken } = useQueue();

  useEffect(() => {
    if (token !== "") {
      setDisabled(false);
    }
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
