"use client";

import { useEffect, useState } from "react";
import { MangaEffect } from "./MangaEffect";
import { Tabs, type TabItem, type TabsProps } from "../primitives/Tabs";

export type ResponsiveTabsProps<Value extends string = string> = Omit<TabsProps<Value>, "orientation" | "value" | "onValueChange"> & {
  defaultValue: Value;
  orientationBreakpoint?: number;
  containerClassName?: string;
};

/** Tabs with package-owned selected state and breakpoint-aware keyboard orientation. */
export function ResponsiveTabs<Value extends string>({
  items, defaultValue, label, orientationBreakpoint = 800, containerClassName, ...tabsProps
}: ResponsiveTabsProps<Value>) {
  const [value, setValue] = useState(defaultValue);
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("vertical");

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${orientationBreakpoint}px)`);
    const updateOrientation = () => setOrientation(media.matches ? "horizontal" : "vertical");
    updateOrientation();
    media.addEventListener("change", updateOrientation);
    return () => media.removeEventListener("change", updateOrientation);
  }, [orientationBreakpoint]);

  return <MangaEffect panel className={containerClassName}>
    <Tabs<Value> items={items as readonly TabItem<Value>[]} value={value} onValueChange={setValue} label={label} orientation={orientation} {...tabsProps}/>
  </MangaEffect>;
}
