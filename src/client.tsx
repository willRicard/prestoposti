import "./globals.css";

import { hydrateRoot } from "react-dom/client";

import { RouterProvider } from "@tanstack/react-router";
import router from "./router.ts";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

hydrateRoot(document, <RouterProvider router={router} />);
