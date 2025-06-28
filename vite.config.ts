import { defineConfig } from "vite";
import devServer from "@hono/vite-dev-server";
import bunAdapter from "@hono/vite-dev-server/bun";

export default defineConfig({
  ssr: {
    external: ["react", "react-dom"],
  },
  plugins: [
    devServer({
      adapter: bunAdapter,
      entry: "src/index.tsx",
    }),
  ],
});
