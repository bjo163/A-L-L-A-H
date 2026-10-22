import type { ReactNode } from "react";
import { BrandLockup } from "../brand/BrandConcepts";
import { Panel } from "../primitives/Panel";

export type AuthLayoutProps = {
  title: ReactNode;
  description?: ReactNode;
  brandName: string;
  brandDescriptor: string;
  children?: ReactNode;
  className?: string;
};

export function AuthLayout({ title, description, brandName, brandDescriptor, children, className = "" }: AuthLayoutProps) {
  return <div className={`eol-auth-layout ${className}`.trim()}><Panel manga as="section" className="eol-auth-card eol-manga-reveal"><BrandLockup size="compact" name={brandName} descriptor={brandDescriptor} /><h1>{title}</h1>{description && <p>{description}</p>}{children}</Panel></div>;
}
