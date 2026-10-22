import type { ReactNode } from "react";
import { classNames } from "../primitives/classNames";

export type ListDetailProps<Item, Key extends string | number = string | number> = {
  items: readonly Item[];
  selectedKey?: Key;
  getKey: (item: Item) => Key;
  renderListItem: (item: Item, selected: boolean) => ReactNode;
  renderDetail: (item: Item) => ReactNode;
  onSelect: (item: Item) => void;
  empty?: ReactNode;
  className?: string;
};

export function ListDetail<Item, Key extends string | number = string | number>({ items, selectedKey, getKey, renderListItem, renderDetail, onSelect, empty = "No items", className }: ListDetailProps<Item, Key>) {
  const selected = items.find((item) => getKey(item) === selectedKey) ?? items[0];
  return <div className={classNames("eol-list-detail", className)}><div className="eol-list-detail__list" role="listbox" aria-label="Items">{items.length ? items.map((item) => { const isSelected = selected != null && getKey(item) === getKey(selected); return <button type="button" role="option" aria-selected={isSelected} key={String(getKey(item))} onClick={() => onSelect(item)}>{renderListItem(item, isSelected)}</button>; }) : <div className="eol-list-detail__empty">{empty}</div>}</div><section className="eol-list-detail__detail" aria-live="polite">{selected ? renderDetail(selected) : empty}</section></div>;
}
