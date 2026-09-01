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
    host: "0.0.0.0",
    port: 5173,
    open: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 5173,
  },
});
