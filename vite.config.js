import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    // Render đổi hostnames (vd: appjapanlearning-1.onrender.com) — cho phép mọi subdomain .onrender.com
    allowedHosts: [".onrender.com"],
  },
  preview: {
    host: true,
    port: 4173,
  },
});
