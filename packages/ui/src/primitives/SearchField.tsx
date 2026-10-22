import type { InputHTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";
import { classNames } from "./classNames";

export type SearchFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  onClear?: () => void;
  scopeLabel?: ReactNode;
  shortcutHint?: ReactNode;
};

export function SearchField({ className, onClear, scopeLabel, shortcutHint, value, defaultValue, ...props }: SearchFieldProps) {
  const hasValue = value !== undefined ? String(value).length > 0 : Boolean(defaultValue);
  return (
    <div className={classNames("eol-search-field", className)}>
      {scopeLabel && <span className="eol-search-field__scope">{scopeLabel}</span>}
      <Icon name="search" size={16} aria-hidden="true" />
      <input {...props} type="search" value={value} defaultValue={defaultValue} />
      {shortcutHint && <kbd className="eol-search-field__shortcut">{shortcutHint}</kbd>}
      {onClear && hasValue && <button type="button" className="eol-search-field__clear" aria-label="Clear search" onClick={onClear}><Icon name="close" size={14} /></button>}
    </div>
  );
}
