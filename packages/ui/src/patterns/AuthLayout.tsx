import type { ReactNode } from "react";
import { BrandLockup } from "../brand/BrandIdentity";
import { MoonIcon, SunIcon } from "../primitives/Icon";
import { Panel } from "../primitives/Panel";
import { ThemeControl } from "./ThemeControl";

export type AuthLayoutProps = {
  title: ReactNode;
  description?: ReactNode;
  brandName: string;
  brandDescriptor: string;
  appearanceControl?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function AuthLayout({ title, description, brandName, brandDescriptor, appearanceControl, children, className = "" }: AuthLayoutProps) {
  const control = appearanceControl ?? <ThemeControl label="Tema tampilan" lightLabel="Terang" darkLabel="Gelap" lightIcon={<SunIcon size={15} />} darkIcon={<MoonIcon size={15} />} />;
  return <div className={`eol-auth-layout ${className}`.trim()}><Panel manga as="section" className="eol-auth-card eol-manga-reveal"><div className="eol-auth-layout__header"><BrandLockup size="compact" name={brandName} descriptor={brandDescriptor} /><div className="eol-auth-layout__appearance">{control}</div></div><h1>{title}</h1>{description && <p>{description}</p>}{children}</Panel></div>;
}
