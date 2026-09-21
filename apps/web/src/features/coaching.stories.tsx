import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { findings, usageBuckets } from "@oxagen-arp/fixtures";
import { Shell } from "@/components/shell";
import { Coaching } from "./coaching";

const meta = {
  title: "Screens/Operator coaching",
  component: Coaching,
  decorators: [(Story) => <Shell><Story /></Shell>],
  args: {
    usage: usageBuckets,
    excludedRequests: 3,
    findings,
    measured: [{ comparisonId: "cmp_1", label: "Trace excerpt vs pasted trace, 6 matched runs", sampleSize: 6, reduction: { minor: 1260 } }],
    commands: { respond: async () => undefined },
  },
} satisfies Meta<typeof Coaching>;
export default meta;
type Story = StoryObj<typeof meta>;

export const WithSuggestions: Story = {};
export const NothingMeasuredYet: Story = { args: { measured: [] } };
export const NoSuggestions: Story = { args: { findings: [] } };
export const AllUnknownUsage: Story = { args: { usage: usageBuckets.map((b) => ({ ...b, inputTokens: null, cacheReadTokens: null, cacheWriteTokens: null, outputTokens: null, tokenReuseRate: null, basis: "estimated" as const })), excludedRequests: 68 } };
