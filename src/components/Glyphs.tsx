/* Small drawn pictures of the shop, 24 px grid. */

export const CartGlyph = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h3.2l2.4 11.6a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.5L21.8 7H6.2" />
    <circle cx="10" cy="20.4" r="1.4" />
    <circle cx="18" cy="20.4" r="1.4" />
  </svg>
);

/** a map pin: the shop that holds a piece */
export const PinGlyph = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s-7-6.2-7-11.2A7 7 0 0 1 19 9.800C19 14.800 12 21 12 21Z" />
    <circle cx="12" cy="9.800" r="2.400" />
  </svg>
);

/** a small shield: the guarantees */
export const ShieldGlyph = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.800 4.500 5.800v5.700c0 4.700 3.200 8.100 7.500 9.700 4.300-1.600 7.500-5 7.500-9.700V5.800L12 2.800Z" />
    <path d="m8.800 12 2.300 2.300 4.200-4.600" />
  </svg>
);
