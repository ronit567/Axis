// Shared design tokens. Screens were styled independently and the palette
// drifted (two different "price" colours, three different "selected chip"
// looks, two grey families). These tokens are the single source of truth —
// import them instead of re-typing hex values so the app stays consistent.

export const colors = {
  // Brand
  primary: '#502E82', // deep purple — primary actions, selected state, price
  primaryDark: '#3F2568',
  lilac: '#B39BD5', // light purple — accents, secondary emphasis
  lilacTint: '#F3EAFA', // tinted lilac fill (icon chips, pills)
  lilacTintAlt: '#F3EFF9', // tinted lilac fill (inputs, thumbnails)

  // Surfaces
  appBg: '#F6F4FA', // app background behind cards
  surface: '#FFFFFF',
  surfaceMuted: '#FAFAFA', // raised rows / cards on white

  // Borders / dividers (all lilac-grey, no neutral greys)
  border: '#E8E3F1',
  borderSoft: '#EDE8F4',
  borderFaint: '#F0ECF7',

  // Text
  textPrimary: '#1F1B29',
  textBody: '#333333',
  textSecondary: '#666666',
  textMuted: '#9B91A8',
  textFaint: '#C4BCD1',

  // On-purple text
  onPrimary: '#FFFFFF',
  onPrimaryMuted: '#D8CCEC',
  onPrimaryDim: '#C9B8E4',
  onPrimarySoft: '#E2D6F5',

  // Status
  save: '#E0245E', // heart / saved
  success: '#2E7D32',
  successBg: '#E8F5E9',
  successTint: '#4CAF50',
  danger: '#D32F2F',
  dangerBg: '#FFF5F5',
  dangerBorder: '#FFCDD2',
  warning: '#FF9800',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 28,
  round: 999,
};

// Custom font families (Poppins). Use these instead of fontWeight — when a
// named family is set, fontWeight is ignored and risks faux-bold rendering.
export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
};

// Common card shadow so elevation reads the same across the app.
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
};
