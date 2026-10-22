import type { ReactNode } from "react";

export type ModuleGridItem = { id: string; number: string; name: ReactNode; status: ReactNode };
export type ModuleGridProps = { items: readonly ModuleGridItem[]; label?: string };

/** Compact module inventory grid with a consistent numbered status hierarchy. */
export function ModuleGrid({ items, label = "Modules" }: ModuleGridProps) {
  return <div className="module-grid" role="list" aria-label={label}>
    {items.map((item) => <div key={item.id} role="listitem">
      <span>{item.number}</span>{item.name}<small>{item.status}</small>
    </div>)}
  </div>;
}
