// ============================================================
// Real Data: Chonburi Province — aggregated from Shapefile
// Source: miniproject_shp/ALL/Chonburi_Gas_LST.shp (4,800 grid points)
//         Predict_2027/Chonburi_predict_2027.shp
// ============================================================

// Years in the dataset (2018–2026 historical + 2027 predicted)
export const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027];

// Province-wide averages per year (computed from 4,800 grid points)
export const timeSeriesData = {
  lst:  [32.298, 34.447, 34.122, 33.298, 32.813, 34.472, 34.089, 32.129, 33.599, 33.355],  // °C (2027 = predicted)
  ch4:  [1851.91, 1867.34, 1892.90, 1913.77, 1920.62, 1928.54, 1936.71, 1942.31, 1942.74, null], // ppb
  co:   [0.03546, 0.03857, 0.04076, 0.03821, 0.03583, 0.03918, 0.03893, 0.03695, 0.04003, null], // mol/m²
  no2:  [0.000018, 0.0000149, 0.0000114, 0.0000167, 0.0000163, 0.0000234, 0.0000227, 0.0000301, 0.0000314, null], // mol/m²
  o3:   [0.11276, 0.11634, 0.11741, 0.11809, 0.11977, 0.11896, 0.11937, 0.11848, 0.11672, null], // mol/m²
  so2:  [5.18e-5, -1.12e-5, -1.53e-5, 5.48e-6, 7.02e-6, 1.14e-5, -2.5e-6, 1.99e-5, 7.46e-6, null], // mol/m²
};

// Predicted 2027 summary
export const predict2027 = {
  avgLst2026: 33.599,
  avgLst2027: 33.355,
  deltaLst: -0.244, // predicted decrease
};

// ---- Color Helpers ----
export function getLstColor(lst) {
  if (lst >= 40) return '#a50026';
  if (lst >= 38) return '#d73027';
  if (lst >= 36) return '#f46d43';
  if (lst >= 34) return '#fdae61';
  if (lst >= 32) return '#fee08b';
  if (lst >= 28) return '#74add1';
  return '#313695';
}

export function getNdviColor(v) {
  if (v >= 0.3) return '#1a9850';
  if (v >= 0.2) return '#91cf60';
  if (v >= 0.1) return '#fee08b';
  return '#d73027';
}

export function getCH4Color(v) {
  if (v >= 1940) return '#7c3aed';
  if (v >= 1920) return '#a855f7';
  if (v >= 1900) return '#c084fc';
  if (v >= 1870) return '#ddd6fe';
  return '#ede9fe';
}

export function getCOColor(v) {
  if (v >= 0.04) return '#ea580c';
  if (v >= 0.038) return '#f97316';
  if (v >= 0.036) return '#fb923c';
  return '#fed7aa';
}

export function getNO2Color(v) {
  // v in mol/m², scale to visible range
  const scaled = v * 1e5; // 0 - 3.5 range
  if (scaled >= 3.0) return '#be123c';
  if (scaled >= 2.0) return '#e11d48';
  if (scaled >= 1.5) return '#f43f5e';
  if (scaled >= 1.0) return '#fb7185';
  return '#fecdd3';
}

export function getO3Color(v) {
  if (v >= 0.119) return '#0369a1';
  if (v >= 0.117) return '#0284c7';
  if (v >= 0.115) return '#0ea5e9';
  if (v >= 0.112) return '#38bdf8';
  return '#bae6fd';
}

// Legacy sample data (kept for chart compatibility, replaced by real GeoJSON on map)
export const sampleData = {
  type: 'FeatureCollection',
  features: [],
};
