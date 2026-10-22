import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeBootstrap } from "@empire/ui";
import "@empire/ui/ui.css";

export const metadata: Metadata = {
  title: "A-L-L-A-H Command Center — Empire of the Light",
  description: "Operator workspace for the Empire of the Light platform.",
};

export default function CommandCenterLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" data-theme="dark" suppressHydrationWarning>
      <head>
        <ThemeBootstrap />
      </head>
      <body>{children}</body>
    </html>
  );
}
