/** The Sport Gravír mark: a medal on its ribbon (a star in an engraved ring); the wordmark is live text. `light` = for dark backgrounds. */
export function Mark({ size = 44, light = false, className = "" }: { size?: number; light?: boolean; className?: string }) {
  const star = "M32 17l4.400 9.200 10.100 1.300-7.400 7 1.900 10-9-4.900-9 4.900 1.900-10-7.400-7 10.100-1.300z";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={`shrink-0 ${className}`}>
      <path d="M20 4h10l6 22h-9z" fill={light ? "#d6dae8" : "#172037"} />
      <path d="M44 4H34l-6 22h9z" fill="#8a1f2b" />
      <circle cx="32" cy="38" r="22" fill={light ? "none" : "#f3efe6"} stroke="#c8a24a" strokeWidth="2" />
      <circle cx="32" cy="38" r="17.500" fill="none" stroke="#c8a24a" strokeOpacity=".55" strokeWidth="1" strokeDasharray="1.2 2.400" />
      <path d={star} transform="translate(0 6)" fill={light ? "#f3efe6" : "#172037"} />
    </svg>
  );
}

export default function Logo({ light = false, small = false }: { light?: boolean; small?: boolean }) {
  return (
    <span className="flex items-center gap-2.5 sm:gap-3">
      <Mark size={small ? 36 : 48} light={light} />
      <span className="flex flex-col leading-none" style={{ color: light ? "#fff" : "var(--ink)" }}>
        <span className={`font-[family-name:var(--font-logo)] font-bold tracking-[0.04em] ${small ? "text-[20px]" : "text-[21px] sm:text-[25px]"}`}>
          SPORT <span style={{ color: light ? "var(--gold)" : "var(--gold-dark)" }}>GRAVÍR</span>
        </span>
        <span className={`mt-1.5 font-bold tracking-[0.22em] max-sm:hidden ${small ? "text-[9px]" : "text-[10px]"}`} style={{ color: light ? "var(--mist)" : "var(--ink-2)" }}>
          SERLEGBOLT · 1990 ÓTA
        </span>
      </span>
    </span>
  );
}
