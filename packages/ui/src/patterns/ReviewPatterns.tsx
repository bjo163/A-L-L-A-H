import type { ReactNode } from "react";
import { ActionGroup } from "./ActionGroup";
import { classNames } from "../primitives/classNames";

export type FormSectionProps = { title: ReactNode; description?: ReactNode; children?: ReactNode; className?: string };
export function FormSection({ title, description, children, className }: FormSectionProps) { return <section className={classNames("eol-form-section", className)}><header><h2>{title}</h2>{description && <p>{description}</p>}</header>{children}</section>; }
export type ReviewActionsProps = { children?: ReactNode; className?: string };
export function ReviewActions({ children, className }: ReviewActionsProps) { return <ActionGroup className={classNames("eol-review-actions", className)}>{children}</ActionGroup>; }
export type DecisionSummaryProps = { title?: ReactNode; decision: ReactNode; rationale?: ReactNode; className?: string };
export function DecisionSummary({ title = "Decision", decision, rationale, className }: DecisionSummaryProps) { return <aside className={classNames("eol-decision-summary", className)}><strong>{title}</strong><span>{decision}</span>{rationale && <p>{rationale}</p>}</aside>; }
