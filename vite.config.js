import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import apiApp from "./server/app.js";

function localApiPlugin() {
  return {
    name: "local-user-auth-api",
    configureServer(server) {
      server.middlewares.use(apiApp);
    },
    configurePreviewServer(server) {
      server.middlewares.use(apiApp);
    },
  };
}

export default defineConfig({
  plugins: [react(), localApiPlugin()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    open: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 5173,
  },
});
