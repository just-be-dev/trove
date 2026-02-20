import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  browser: "chrome",
  manifestVersion: 3,
  manifest: {
    name: "Trove — Save to Collection",
    description: "Save interesting web pages to your Trove collection with one shortcut.",
    version: "0.0.1",
    permissions: ["activeTab", "storage", "scripting"],
    commands: {
      "save-page": {
        suggested_key: {
          default: "Ctrl+Shift+S",
          mac: "Command+Shift+S",
        },
        description: "Save current page to Trove",
      },
    },
  },
});
