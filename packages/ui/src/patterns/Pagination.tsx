import type { HTMLAttributes } from "react";
import { Icon } from "../primitives/Icon";
import { classNames } from "../primitives/classNames";

export type PaginationProps = Omit<HTMLAttributes<HTMLElement>, "children"> & { page: number; totalPages: number; onPageChange: (page: number) => void; previousLabel?: string; nextLabel?: string };

export function Pagination({ page, totalPages, onPageChange, previousLabel = "Previous page", nextLabel = "Next page", className, ...props }: PaginationProps) {
  const safeTotal = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotal);
  return <nav {...props} className={classNames("eol-pagination", className)} aria-label="Pagination"><button type="button" aria-label={previousLabel} disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)}><Icon name="chevronLeft" size={14} /></button><span aria-live="polite">Page {safePage} of {safeTotal}</span><button type="button" aria-label={nextLabel} disabled={safePage >= safeTotal} onClick={() => onPageChange(safePage + 1)}><Icon name="chevronRight" size={14} /></button></nav>;
}
