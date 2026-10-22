import type { HTMLAttributes } from "react";
import { classNames } from "./classNames";

export type NoticeTone = "info" | "success" | "warning" | "danger";

type NoticeRole = "status" | "alert" | "note";

export type NoticeProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  tone?: NoticeTone;
  role?: NoticeRole;
};

export function Notice({
  children,
  className,
  tone = "info",
  role = tone === "danger" ? "alert" : "status",
  ...props
}: NoticeProps) {
  return (
    <div
      className={classNames("eol-notice", `eol-notice--${tone}`, className)}
      role={role}
      {...props}
    >
      {children}
    </div>
  );
}
