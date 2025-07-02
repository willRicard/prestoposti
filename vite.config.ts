import { defineConfig, type PluginOption } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import devServer, { defaultOptions } from "@hono/vite-dev-server";
import bunAdapter from "@hono/vite-dev-server/bun";

const serverDirectivePlugin = (): PluginOption => {
  return {
    name: "server-directive-plugin",
    enforce: "pre",
    transform(code) {
      if (code.includes("use server")) {
        return {
          code: "",
          map: null,
        };
      }
    },
  };
};

export default defineConfig(({ mode }) => {
  if (mode === "production") {
    return {
      build: {
        manifest: true,
        rollupOptions: {
          input: "./src/client.tsx",
          onwarn(warning, warn) {
            if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
              return;
            }
            warn(warning);
          },
        },
      },
      plugins: [
        tanstackRouter({ target: "react" }),
        tailwindcss(),
        serverDirectivePlugin(),
      ],
    };
  } else {
    return {
      ssr: {
        external: ["react", "react-dom"],
      },
      plugins: [
        tanstackRouter({ target: "react" }),
        tailwindcss(),
        devServer({
          adapter: bunAdapter,
          entry: "src/index.tsx",
        }),
      ],
    };
  }
});
