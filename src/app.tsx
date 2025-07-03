import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

import QueueForm from "./components/queue_form";
import { MODAL_DELAY, type QueueItemData } from "./lib/constants";
import { useQueue } from "./client/hooks";

const App = () => {
  const [error, setError] = useState("");

  const { token, setToken } = useQueue();
  const navigate = useNavigate({ from: "/" });

  // Show waiting UI when in queue
  useEffect(() => {
    if (!token) {
      return;
    }
    navigate({ to: "/queue" });
  }, [token]);

  const handleSubmit = (req: QueueItemData) => {
    fetch("/api/queue", {
      method: "POST",
      body: JSON.stringify(req),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        if (res.status !== 200) {
          throw new Error(res.statusText);
        }
        const { token, eta } = await res.json();
        setToken(token);
      })
      .catch((err) => {
        setError(err.toString());
      });
  };

  const handleErrorClose = () => {
    setError("");
  };

  return (
    <>
      <QueueForm onSubmit={handleSubmit} />
      <Snackbar
        open={error !== ""}
        autoHideDuration={MODAL_DELAY}
        onClose={handleErrorClose}
      >
        <Alert severity="error" onClose={handleErrorClose}>
          Failed joining the queue. Please try again.
        </Alert>
      </Snackbar>
    </>
  );
};

export default App;
