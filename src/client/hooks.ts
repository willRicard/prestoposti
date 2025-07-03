import { useState, useEffect } from "react";

export function useQueue() {
  const [token, setToken] = useState("");

  // Load token from localStorage if available
  useEffect(() => {
    const localToken = localStorage.getItem("pp-token");
    if (!localToken) {
      return;
    }
    setToken(localToken);
  }, []);

  // Save token when set
  useEffect(() => {
    localStorage.setItem("pp-token", token);
  }, [token]);

  const deleteToken = () => {
    localStorage.removeItem("pp-token");
  };

  return { token, setToken, deleteToken };
}
