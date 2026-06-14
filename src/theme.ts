// Dark "instrument" palette. The data hues are brightened so they glow on the
// near-black canvas; the indigo accent is reserved for interactive chrome only
// (active controls, the current-threshold marker, focus rings) so color stays
// meaningful instead of decorative. Still colorblind-distinguishable
// (blue / amber / green / violet are separable under common CVD).
export const COLORS = {
  relevant: '#5BB0FF', // blue
  irrelevant: '#F4A83A', // amber
  precision: '#5BB0FF',
  recall: '#F4A83A',
  f1: '#2FD79B', // emerald
  cost: '#C77DFF', // violet
  costOptimal: '#C77DFF',
  fbetaOptimal: '#2FD79B',
  marker: '#6E8BFF', // accent — current threshold

  // chart chrome
  grid: '#20252E',
  axisText: '#6A727F',
  tooltipBg: '#181C24',
  tooltipBorder: '#313845',
  tooltipText: '#E8EBEF',
};
