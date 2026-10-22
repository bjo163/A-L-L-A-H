/** Small state-specific artwork kept decorative so state text stays authoritative. */
export function StateArtwork({ variant }: { variant: "empty" | "error" }) {
  return (
    <svg aria-hidden="true" className="eol-state__artwork-icon" focusable="false" viewBox="0 0 120 90" fill="none">
      {variant === "empty" ? (
        <>
          <path d="M15 24h90v52H15z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          <path d="M15 39h22l9 11h28l9-11h22M39 62h42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="93" cy="66" r="8" fill="currentColor" />
        </>
      ) : (
        <>
          <circle cx="60" cy="45" r="34" stroke="currentColor" strokeWidth="3" />
          <path d="M60 26v23" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <circle cx="60" cy="62" r="3.5" fill="currentColor" />
          <path d="m21 17 8 5m70-5-8 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
