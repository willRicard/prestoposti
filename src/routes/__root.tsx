import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import Container from "@mui/material/Container";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center">
      <h1 className="font-bold">404 Not Found</h1>
      <p>This is probably not what you are looking for:</p>
      <Link className="underline" to="/">
        return Home
      </Link>
    </div>
  ),
});

function RootComponent() {
  return (
    <Container>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-9">
        <Outlet />
      </div>
      <footer className="py-3 absolute bottom-0 left-0 right-0 flex items-center justify-center">
        <div></div>
        <span>&copy; 2025 Guillaume RICARD. All rights reserved.</span>
      </footer>
      <TanStackRouterDevtools />
    </Container>
  );
}
