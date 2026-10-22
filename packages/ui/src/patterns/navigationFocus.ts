/** Move keyboard focus to the first visible page heading after navigation. */
export function focusNavigationHeading(container?: HTMLElement | null, fallback?: HTMLElement | null) {
  const heading = container
    ? Array.from(container.querySelectorAll<HTMLElement>("h1")).find((item) =>
        !item.classList.contains("eol-visually-hidden") &&
        item.getClientRects().length > 0 &&
        getComputedStyle(item).visibility !== "hidden",
      )
    : null;
  const target = heading ?? container ?? fallback;
  if (!target) return;
  if (target !== container && !target.hasAttribute("tabindex")) target.tabIndex = -1;
  target.focus({ preventScroll: true });
}

/** Focus a hash destination and make non-interactive anchors programmatically focusable. */
export function focusNavigationAnchor(hash: string) {
  if (!hash || hash === "#") return;
  let id: string;
  try {
    id = decodeURIComponent(hash.slice(1));
  } catch {
    return;
  }
  const target = document.getElementById(id);
  if (!target || !(target instanceof HTMLElement)) return;
  if (!target.matches("a[href], button, input, select, textarea, summary, [tabindex], [contenteditable=true]")) target.tabIndex = -1;
  target.scrollIntoView({ block: "start", behavior: "auto" });
  target.focus({ preventScroll: true });
}
