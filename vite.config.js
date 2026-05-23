import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ─────────────────────────────────────────────────────────────────────────────
// GITHUB PAGES SETUP:
// Change the `base` below to match your GitHub repository name.
// e.g. if your repo is github.com/yourname/flowboost → base: "/flowboost/"
// If using a custom domain → base: "/"
// ─────────────────────────────────────────────────────────────────────────────
export default defineConfig({
  plugins: [react()],
  base: "/waveport/", // ← Change this to your repo name
});
