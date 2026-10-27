// Indicative Bali prices in IDR, carried over from the original Bali trip app.
// Shown only for Trips whose destination mentions Bali.

export interface PriceGuideItem { label: string; idr: number; note?: string }

export const BALI_PRICE_GUIDE: PriceGuideItem[] = [
  { label: 'Kopi · iced latte', idr: 35_000, note: 'café' },
  { label: 'Bintang large', idr: 55_000, note: 'warung' },
  { label: 'Nasi goreng · mie', idr: 45_000, note: 'warung' },
  { label: 'Beach club dinner', idr: 400_000, note: 'per head' },
  { label: 'Scooter · per day', idr: 80_000 },
  { label: 'Grab · airport → Seminyak', idr: 220_000 },
  { label: 'Surf lesson · 2h', idr: 500_000 },
  { label: 'Fast boat · Sanur–Penida', idr: 400_000, note: 'return' },
  { label: 'Pool villa · per night', idr: 3_700_000 },
  { label: 'Balinese massage · 60 min', idr: 250_000 },
]

export function showsBaliGuide(destination: string): boolean {
  return /\bbali\b/iu.test(destination)
}
