import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { budgets, devices, modelRoutes } from "@oxagen-arp/fixtures";
import { Shell } from "@/components/shell";
import { SendWork } from "./send-work";

const meta = {
  title: "Screens/Send work",
  component: SendWork,
  decorators: [(Story) => <Shell><Story /></Shell>],
  args: { routes: modelRoutes, devices, budget: budgets, paired: true },
} satisfies Meta<typeof SendWork>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Paired: Story = {};
export const BrowserNotPaired: Story = { args: { paired: false } };
export const NoModelRoute: Story = { args: { routes: [] } };
export const NoDevices: Story = { args: { devices: [] } };
