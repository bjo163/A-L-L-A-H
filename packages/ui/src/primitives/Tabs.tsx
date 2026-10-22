import { useId, type KeyboardEvent, type ReactNode } from "react";
import { classNames } from "./classNames";

export type TabsOrientation = "horizontal" | "vertical";

export type TabItem<Value extends string = string> = {
  value: Value;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
};

export type TabsProps<Value extends string = string> = {
  items: readonly TabItem<Value>[];
  value: Value;
  onValueChange: (value: Value) => void;
  label: string;
  orientation?: TabsOrientation;
  className?: string;
  listClassName?: string;
  tabClassName?: string;
  selectedTabClassName?: string;
  panelClassName?: string;
};

export function Tabs<Value extends string>({
  items,
  value,
  onValueChange,
  label,
  orientation = "horizontal",
  className,
  listClassName,
  tabClassName,
  selectedTabClassName,
  panelClassName,
}: TabsProps<Value>) {
  const generatedId = useId().replaceAll(":", "");
  const enabledItems = items.filter((item) => !item.disabled);
  const selectedItem = enabledItems.find((item) => item.value === value) ?? enabledItems[0];

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentValue: Value) {
    const isNext = orientation === "horizontal" ? event.key === "ArrowRight" : event.key === "ArrowDown";
    const isPrevious = orientation === "horizontal" ? event.key === "ArrowLeft" : event.key === "ArrowUp";
    const currentIndex = enabledItems.findIndex((item) => item.value === currentValue);
    let nextIndex = currentIndex;

    if (isNext) nextIndex = (currentIndex + 1) % enabledItems.length;
    else if (isPrevious) nextIndex = (currentIndex - 1 + enabledItems.length) % enabledItems.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = enabledItems.length - 1;
    else return;

    event.preventDefault();
    const nextItem = enabledItems[nextIndex];
    const nextButton = Array.from(
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]") ?? [],
    ).find((button) => button.dataset.eolTabValue === nextItem.value);
    nextButton?.focus();
    onValueChange(nextItem.value);
  }

  if (!selectedItem) return null;
  const selectedIndex = items.indexOf(selectedItem);

  return (
    <div className={classNames("eol-tabs", className)}>
      <div
        role="tablist"
        aria-label={label}
        aria-orientation={orientation}
        className={classNames("eol-tabs__list", listClassName)}
      >
        {items.map((item, index) => {
          const selected = item.value === selectedItem.value;
          const tabId = `${generatedId}-tab-${index}`;
          const panelId = `${generatedId}-panel-${index}`;

          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              id={tabId}
              data-eol-tab-value={item.value}
              aria-controls={panelId}
              aria-selected={selected}
              aria-disabled={item.disabled || undefined}
              disabled={item.disabled}
              tabIndex={selected ? 0 : -1}
              className={classNames(
                "eol-tabs__tab",
                tabClassName,
                selected && "eol-tabs__tab--selected",
                selected && selectedTabClassName,
              )}
              onClick={() => onValueChange(item.value)}
              onKeyDown={(event) => handleKeyDown(event, item.value)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item, index) => {
        const selected = index === selectedIndex;
        return (
          <div
            key={item.value}
            role="tabpanel"
            id={`${generatedId}-panel-${index}`}
            aria-labelledby={`${generatedId}-tab-${index}`}
            hidden={!selected}
            tabIndex={selected ? 0 : undefined}
            className={classNames("eol-tabs__panel", panelClassName)}
          >
            {selected ? item.content : null}
          </div>
        );
      })}
    </div>
  );
}
