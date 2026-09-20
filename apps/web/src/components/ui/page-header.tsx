import type { ReactNode } from "react";

export function PageHeader({ title, deck, actions }: { title: string; deck?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold leading-tight">{title}</h1>
        {deck ? <p className="mt-1 max-w-prose text-muted">{deck}</p> : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </header>
  );
}
