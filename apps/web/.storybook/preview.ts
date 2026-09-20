import type { Preview } from "@storybook/nextjs-vite";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    backgrounds: { disable: true },
    a11y: { test: "error" },
  },
  globalTypes: {
    theme: { description: "Theme", toolbar: { icon: "mirror", items: ["light", "dark"], dynamicTitle: true } },
  },
  initialGlobals: { theme: "light" },
  decorators: [
    (Story, ctx) => {
      document.documentElement.dataset.theme = String(ctx.globals.theme ?? "light");
      return Story();
    },
  ],
};

export default preview;
