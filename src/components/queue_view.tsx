import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import Button from "@mui/material/Button";

export default function QueueView({ token }: { token: string }) {
  const [disabled, setDisabled] = useState(true);
  const navigate = useNavigate({ from: "/queue" });

  useEffect(() => {
    if (!token) {
      navigate({ to: "/" });
    }
    if (token !== "") {
      setDisabled(false);
    }
  }, [token]);

  return (
    <div className="flex flex-col gap-9">
      <h2>Thank you for your patience</h2>
      <Button variant="contained" color="success" disabled={disabled}>
        Check in
      </Button>
    </div>
  );
}
