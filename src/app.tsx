import { useState, useEffect } from "react";

import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
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
    <Container>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-9">
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
      </div>
      <footer className="py-3 absolute bottom-0 left-0 right-0 flex items-center justify-between">
        <div></div>
        <span>&copy; 2025 Guillaume RICARD. All rights reserved.</span>
        <div className="mr-5">
          Language select:&nbsp;
          <Select defaultValue="en">
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="ja">日本語</MenuItem>
          </Select>
        </div>
      </footer>
    </Container>
  );
};

export default App;
