import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { budgets, runs, workspaces } from "@oxagen-arp/fixtures";
import { Shell } from "@/components/shell";
import { Home } from "./home";

// Stories read the same fixtures the app reads, so a story and a page can never disagree about a
// shape. Every story is one state the specs name.
const meta = {
  title: "Screens/Home",
  component: Home,
  decorators: [(Story) => <Shell><Story /></Shell>],
  args: { workspace: workspaces[0]!, runs, budget: budgets, modelRouteCount: 1 },
} satisfies Meta<typeof Home>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const NothingNeedsYou: Story = { args: { runs: runs.filter((r) => r.state === "running") } };
export const Empty: Story = { args: { runs: [] } };
export const NoModelRoute: Story = { args: { modelRouteCount: 0 } };
