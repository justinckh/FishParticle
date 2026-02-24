import restart from "vite-plugin-restart";
import glsl from "vite-plugin-glsl";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src/",
  publicDir: "../static/",
  base: "./",
  define: {
    global: {},
  },
  server: {
    host: true, // Open to local network and display URL
    open: !("SANDBOX_URL" in process.env || "CODESANDBOX_HOST" in process.env), // Open if it's not a CodeSandbox
    headers: {
      // "Cross-Origin-Opener-Policy": "same-origin",
      // "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "*",
      "Cross-Origin-Embedder-Policy": "*",
    },
  },
  build: {
    outDir: "../dist", // Output in the dist/ folder
    emptyOutDir: true, // Empty the folder first
    sourcemap: true, // Add sourcemap
    format: {
      comments: false, // Removes all comments
    },
  },
  plugins: [
    restart({ restart: ["../static/**"] }), // Restart server on static file change
    glsl(), // Handle shader files
  ],
});
