// Shared price-filter bounds. maxPrice === PRICE_CAP means "no upper limit",
// so expensive items are never silently hidden (the old default of $100 hid
// everything above it — Bug 4).
export const PRICE_CAP = 1000;

export const DEFAULT_FILTERS = {
  category: 'All',
  condition: 'All',
  minPrice: 0,
  maxPrice: PRICE_CAP,
};
