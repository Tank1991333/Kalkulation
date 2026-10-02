import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" erlaubt das Hosting in jedem Unterordner (z. B. GitHub Pages)
export default defineConfig({ plugins: [react()], base: "./" });
