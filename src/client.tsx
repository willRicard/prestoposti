import { hydrateRoot } from "react-dom/client";

import App from "./app.tsx";

document.addEventListener("DOMContentLoaded", () => {
  hydrateRoot(document, <App />);
});
