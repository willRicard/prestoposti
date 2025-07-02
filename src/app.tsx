import { useState, useEffect } from "react";

import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

import QueueForm from "./components/queue_form";
import { MODAL_DELAY, type QueueItemData } from "./lib/constants";

const App = () => {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  // Load token from localStorage if available
  useEffect(() => {
    const localToken = localStorage.getItem("pp-token");
    if (localToken) {
      setToken(token);
    }
  }, []);

  // Show waiting UI when in queue
  useEffect(() => {
    if (!token) {
      return;
    }
    fetch("/api/queue/check", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (res.status !== 200) {
          throw new Error(res.statusText);
        }
      })
      .catch((err) => {
        setError(err.toString());
      });
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
        localStorage.setItem("pp-token", token);
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
