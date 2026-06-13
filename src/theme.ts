// Okabe-Ito colorblind-safe palette (NFR: WCAG 2.1 AA, colorblind-safe).
// These eight hues are distinguishable under the common forms of color vision
// deficiency — the right default for a teaching tool that must read correctly
// for everyone, not just trichromats.
export const COLORS = {
  relevant: '#0072B2', // blue
  irrelevant: '#D55E00', // vermillion
  precision: '#0072B2', // blue (precision = "what we returned")
  recall: '#E69F00', // orange (recall = "what we caught")
  f1: '#009E73', // bluish green (the balance)
  cost: '#CC79A7', // reddish purple
  costOptimal: '#CC79A7',
  fbetaOptimal: '#009E73',
  marker: '#333333', // current-threshold marker
};
