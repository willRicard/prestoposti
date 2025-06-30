import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import devServer, { defaultOptions } from "@hono/vite-dev-server";
import bunAdapter from "@hono/vite-dev-server/bun";

export default defineConfig(({ mode }) => {
  if (mode === "production") {
    return {
      build: {
        manifest: true,
        rollupOptions: {
          input: "./src/client.tsx",
        },
      },
      plugins: [tailwindcss()],
    };
  } else {
    return {
      ssr: {
        external: ["react", "react-dom"],
      },
      plugins: [
        tailwindcss(),
        devServer({
          adapter: bunAdapter,
          exclude: ["/*", ...defaultOptions.exclude],
          entry: "src/index.tsx",
        }),
      ],
    };
  }
});
