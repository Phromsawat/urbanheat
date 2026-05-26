'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getLstColor, getCH4Color, getCOColor, getNO2Color, getO3Color } from '../data/sampleData';

// Fix Leaflet default marker icon paths broken by webpack/Next.js
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const DATA_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027];

// ────────────────────────────────────────────────
// Popup builders
// ────────────────────────────────────────────────
function buildDistrictPopup(p, year, tempDrop = 0, activeLayers = {}) {
  const originalLst = p[`LST_${year}`];
  const lst = originalLst != null ? originalLst - tempDrop : null;
  const ch4 = p[`CH4_${year}`];
  const co  = p[`CO_${year}`];
  const no2 = p[`NO2_${year}`];
  const o3  = p[`O3_${year}`];
  const so2 = p[`SO2_${year}`];

  const fmt  = (v, dec = 4)  => v != null ? v.toFixed(dec) : '—';
  const pct  = lst != null ? Math.min(100, Math.max(0, ((lst - 28) / 14) * 100)) : 0;

  // Filter keys: if no layers are active or passed, show everything
  // Otherwise, only show the variables that are toggled on in the layers control
  const activeKeys = Object.keys(activeLayers).filter(k => k !== 'boundary');
  const hasActiveFilter = activeKeys.length > 0 && activeKeys.some(k => activeLayers[k]);

  const showLst = !hasActiveFilter || activeLayers.lst || activeLayers.predict;
  const showCh4 = !hasActiveFilter || activeLayers.ch4;
  const showCo  = !hasActiveFilter || activeLayers.co;
  const showNo2 = !hasActiveFilter || activeLayers.no2;
  const showO3  = !hasActiveFilter || activeLayers.o3;

  let rows = [];

  if (showLst) {
    rows.push(`
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.08)">
        <span style="color:#9ca3af">LST เฉลี่ย ${tempDrop > 0 ? '(เดิม)' : ''}</span>
        <span style="font-weight:700;color:${originalLst != null ? getLstColor(originalLst) : '#999'}">${originalLst != null ? originalLst.toFixed(2) + ' °C' : '—'}</span>
      </div>
      ${tempDrop > 0 ? `
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(52,199,89,0.08);border-radius:4px;padding:4px 6px;margin:2px 0">
        <span style="color:#34c759;font-weight:600">LST (จำลองลดก๊าซ)</span>
        <span style="font-weight:700;color:${lst != null ? getLstColor(lst) : '#999'}">${lst != null ? lst.toFixed(2) + ' °C' : '—'}</span>
      </div>
      ` : ''}
    `);
  }

  if (showCh4) {
    rows.push(`
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.08)">
        <span style="color:#9ca3af">CH₄ (มีเทน)</span>
        <span style="font-weight:500;color:#c084fc">${fmt(ch4,2)} ppb</span>
      </div>
    `);
  }

  if (showCo) {
    rows.push(`
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.08)">
        <span style="color:#9ca3af">CO (คาร์บอนฯ)</span>
        <span style="font-weight:500;color:#fb923c">${co != null ? (co*1000).toFixed(4) : '—'} ×10⁻³</span>
      </div>
    `);
  }

  if (showNo2) {
    rows.push(`
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.08)">
        <span style="color:#9ca3af">NO₂ (ไนโตรเจนฯ)</span>
        <span style="font-weight:500;color:#fda4af">${no2 != null ? (no2*1e6).toFixed(3) : '—'} µmol/m²</span>
      </div>
    `);
  }

  if (showO3) {
    rows.push(`
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px">
        <span style="color:#9ca3af">O₃ (โอโซน)</span>
        <span style="font-weight:500;color:#38bdf8">${fmt(o3)} mol/m²</span>
      </div>
    `);
  }

  const rowsContent = rows.join('');

  return `<div style="font-family:Inter,sans-serif;padding:4px 0;min-width:220px">
    <h4 style="font-size:14px;font-weight:700;margin-bottom:10px;color:#34c759">
      ${p.name_th || p.name || '—'}
    </h4>
    <div style="font-size:11px;color:#9ca3af;margin-bottom:6px">ปี ${year}</div>
    ${rowsContent}
    ${lst != null && showLst ? `
    <div style="width:100%;height:5px;background:rgba(255,255,255,0.12);border-radius:3px;margin-top:10px;overflow:hidden">
      <div style="height:100%;width:${pct}%;background:${getLstColor(lst)};border-radius:3px;transition:width .3s"></div>
    </div>` : ''}
  </div>`;
}

function buildPredictDistrictPopup(p) {
  const lst2026 = p['LST_2026_A'];
  const lst2027 = p['LST_pred_2027'];
  const delta   = (lst2027 != null && lst2026 != null) ? lst2027 - lst2026 : null;
  const col     = delta != null ? (delta > 0 ? '#ff453a' : '#30d158') : '#999';

  return `<div style="font-family:Inter,sans-serif;padding:4px 0;min-width:220px">
    <h4 style="font-size:14px;font-weight:700;margin-bottom:10px;color:#34c759">
      ${p.name_th || p.name || '—'}
    </h4>
    <div style="font-size:11px;color:#9ca3af;margin-bottom:6px">พยากรณ์ปี 2027</div>
    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.08)">
      <span style="color:#9ca3af">LST 2026 (Actual)</span>
      <span style="font-weight:700;color:${lst2026 != null ? getLstColor(lst2026) : '#999'}">${lst2026 != null ? lst2026.toFixed(2) + ' °C' : '—'}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.08)">
      <span style="color:#9ca3af">LST 2027 (Predicted)</span>
      <span style="font-weight:700;color:${lst2027 != null ? getLstColor(lst2027) : '#999'}">${lst2027 != null ? lst2027.toFixed(2) + ' °C' : '—'}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px">
      <span style="color:#9ca3af">Δ Change</span>
      <span style="font-weight:700;color:${col}">${delta != null ? (delta >= 0 ? '+' : '') + delta.toFixed(2) + ' °C' : '—'}</span>
    </div>
  </div>`;
}

// ────────────────────────────────────────────────
// Layer factory — district polygon fill by variable
// ────────────────────────────────────────────────
function makeDistrictLayer(districtData, year, variable, colorFn, opacity, onClickFn, tempDrop = 0, activeLayers = {}) {
  return L.geoJSON(districtData, {
    style: f => {
      let val = f.properties[`${variable}_${year}`];
      if (variable === 'LST' && val != null) {
        val = val - tempDrop;
      }
      return {
        fillColor:   val != null ? colorFn(val) : '#1e293b',
        weight:       2,
        color:        'rgba(255,255,255,0.35)',
        dashArray:    null,
        fillOpacity:  val != null ? opacity : 0.15,
      };
    },
    onEachFeature: (f, layer) => {
      layer.bindTooltip(buildDistrictPopup(f.properties, year, tempDrop, activeLayers), { 
        sticky: true, 
        direction: 'auto',
        opacity: 0.98,
        className: 'map-tooltip-card'
      });
      layer.on('click', () => onClickFn?.(f.properties));
      layer.on('mouseover', function() {
        this.setStyle({ weight: 3, color: 'rgba(255,255,255,0.8)', fillOpacity: Math.min(opacity + 0.15, 1) });
        this.bringToFront();
      });
      layer.on('mouseout', function() {
        const val = f.properties[`${variable}_${year}`];
        this.setStyle({ weight: 2, color: 'rgba(255,255,255,0.35)', fillOpacity: val != null ? opacity : 0.15 });
      });
    }
  });
}

// Predict 2027 district layer
function makePredictLayer(districtData, onClickFn) {
  return L.geoJSON(districtData, {
    style: f => {
      const v = f.properties['LST_pred_2027'];
      return {
        fillColor:  v != null ? getLstColor(v) : '#1e293b',
        weight:      2,
        color:       'rgba(245,158,11,0.5)',
        fillOpacity: v != null ? 0.75 : 0.15,
      };
    },
    onEachFeature: (f, layer) => {
      layer.bindTooltip(buildPredictDistrictPopup(f.properties), { 
        sticky: true, 
        direction: 'auto',
        opacity: 0.98,
        className: 'map-tooltip-card'
      });
      layer.on('click', () => onClickFn?.(f.properties));
      layer.on('mouseover', function() {
        this.setStyle({ weight: 3, color: '#f59e0b', fillOpacity: 0.9 });
        this.bringToFront();
      });
      layer.on('mouseout', function() {
        const v = f.properties['LST_pred_2027'];
        this.setStyle({ weight: 2, color: 'rgba(245,158,11,0.5)', fillOpacity: v != null ? 0.75 : 0.15 });
      });
    }
  });
}

// ────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────
export default function MapView({ 
  yearIndex, 
  onZoneSelect, 
  layers, 
  toggleLayer,
  singleMode,
  setSingleMode,
  enableSingleMode,
  selectAllLayers,
  selectNoneLayers,
  tempDrop = 0
}) {
  const mapRef        = useRef(null);
  const mapInstance   = useRef(null);
  const districtData  = useRef(null);
  const tileLayerRef  = useRef(null);
  const layerRefs     = useRef({ lst: null, ch4: null, co: null, no2: null, o3: null, boundary: null, predict: null });

  const [activeBasemap, setActiveBasemap] = useState('dark');
  const [coords,  setCoords]  = useState('13.3611° N, 100.9847° E');
  const [loading, setLoading] = useState(true);

  // Initialize map once
  useEffect(() => {
    if (mapInstance.current) return;
    const mapEl = mapRef.current;
    if (!mapEl) return;

    let cancelled = false;

    const map = L.map(mapEl, {
      center: [13.3, 101.1],
      zoom: 9,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO | CitySweat',
      maxZoom: 19
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    map.on('mousemove', e => setCoords(`${e.latlng.lat.toFixed(4)}° N, ${e.latlng.lng.toFixed(4)}° E`));
    mapInstance.current = map;

    // Load district GeoJSON (with pre-aggregated data)
    fetch('/chonburi_districts_with_data.geojson')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        districtData.current = data;

        const initYear = DATA_YEARS[8]; // 2026

        // LST — visible by default
        layerRefs.current.lst = makeDistrictLayer(data, initYear, 'LST', getLstColor, 0.72, onZoneSelect, 0, layers);
        layerRefs.current.lst.addTo(map);

        // Other variable layers
        layerRefs.current.ch4 = makeDistrictLayer(data, initYear, 'CH4', getCH4Color, 0.70, onZoneSelect, 0, layers);
        layerRefs.current.co  = makeDistrictLayer(data, initYear, 'CO',  getCOColor,  0.70, onZoneSelect, 0, layers);
        layerRefs.current.no2 = makeDistrictLayer(data, initYear, 'NO2', getNO2Color, 0.70, onZoneSelect, 0, layers);
        layerRefs.current.o3  = makeDistrictLayer(data, initYear, 'O3',  getO3Color,  0.70, onZoneSelect, 0, layers);

        // Predict 2027
        layerRefs.current.predict = makePredictLayer(data, onZoneSelect);

        // District boundary overlay (white outline)
        layerRefs.current.boundary = L.geoJSON(data, {
          style: () => ({
            fillColor:  'transparent',
            weight:      2,
            color:       'rgba(255,255,255,0.6)',
            dashArray:   '5 4',
            fillOpacity: 0
          })
        }).addTo(map);

        // Fit map to district bounds
        try { map.fitBounds(layerRefs.current.lst.getBounds(), { padding: [20, 20] }); } catch (_) {}

        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        console.error('Failed to load district data:', err);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      map.remove();
      mapInstance.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Rebuild layers when year changes or tempDrop simulation changes
  useEffect(() => {
    const map  = mapInstance.current;
    const data = districtData.current;
    if (!map || !data) return;

    const year = DATA_YEARS[Math.min(yearIndex, 8)]; // cap at 2026 for real data

    const varCfgs = [
      { key: 'lst', variable: 'LST', colorFn: getLstColor, opacity: 0.72 },
      { key: 'ch4', variable: 'CH4', colorFn: getCH4Color, opacity: 0.70 },
      { key: 'co',  variable: 'CO',  colorFn: getCOColor,  opacity: 0.70 },
      { key: 'no2', variable: 'NO2', colorFn: getNO2Color, opacity: 0.70 },
      { key: 'o3',  variable: 'O3',  colorFn: getO3Color,  opacity: 0.70 },
    ];

    varCfgs.forEach(({ key, variable, colorFn, opacity }) => {
      const wasVisible = layerRefs.current[key] && map.hasLayer(layerRefs.current[key]);
      if (layerRefs.current[key]) map.removeLayer(layerRefs.current[key]);
      const activeTempDrop = key === 'lst' ? tempDrop : 0;
      const newLayer = makeDistrictLayer(data, year, variable, colorFn, opacity, onZoneSelect, activeTempDrop, layers);
      layerRefs.current[key] = newLayer;
      if (wasVisible) newLayer.addTo(map);
    });
  }, [yearIndex, onZoneSelect, tempDrop, layers]);

  // Toggle layers
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const pairs = [
      [layers.lst,     layerRefs.current.lst],
      [layers.ch4,     layerRefs.current.ch4],
      [layers.co,      layerRefs.current.co],
      [layers.no2,     layerRefs.current.no2],
      [layers.o3,      layerRefs.current.o3],
      [layers.boundary,layerRefs.current.boundary],
      [layers.predict, layerRefs.current.predict],
    ];
    pairs.forEach(([on, layer]) => {
      if (!layer) return;
      if (on  && !map.hasLayer(layer)) layer.addTo(map);
      if (!on &&  map.hasLayer(layer)) map.removeLayer(layer);
    });
  }, [layers]);

  // Handle Basemap switching
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !tileLayerRef.current) return;

    // Remove existing tile layer
    map.removeLayer(tileLayerRef.current);

    let url = '';
    let attribution = '';

    if (activeBasemap === 'dark') {
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; CARTO | CitySweat';
    } else if (activeBasemap === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    } else if (activeBasemap === 'city') {
      url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
    }

    const newTileLayer = L.tileLayer(url, {
      attribution,
      maxZoom: 19
    });

    newTileLayer.addTo(map);
    newTileLayer.bringToBack();
    tileLayerRef.current = newTileLayer;
  }, [activeBasemap]);

  return (
    <>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(11,13,20,0.85)', backdropFilter: 'blur(4px)',
          flexDirection: 'column', gap: 12
        }}>
          <div style={{
            width: 40, height: 40, border: '3px solid rgba(244,109,67,0.3)',
            borderTopColor: '#f46d43', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ color: '#94a3b8', fontSize: 14 }}>กำลังโหลดข้อมูลรายอำเภอ...</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      <div className="coord-display">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/>
          <line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/>
          <line x1="12" y1="22" x2="12" y2="18"/>
        </svg>
        <span>{coords}</span>
      </div>

      <div ref={mapRef} id="map" />

      <div className="layer-controls-floating left">
        <div className="layer-section-title">แสดงเลเยอร์</div>
        
        {/* Selection Mode Selector */}
        <div className="layer-mode-controls">
          <button 
            className={`mode-btn ${!singleMode ? 'active' : ''}`}
            onClick={() => setSingleMode?.(false)}
            title="แสดงผลพร้อมกันได้หลายเลเยอร์"
          >
            แสดงซ้อน
          </button>
          <button 
            className={`mode-btn ${singleMode ? 'active' : ''}`}
            onClick={() => enableSingleMode?.()}
            title="แสดงผลทีละเลเยอร์ (สลับไปมา)"
          >
            แสดงเดี่ยว
          </button>
        </div>

        {/* Quick Action buttons */}
        <div className="layer-quick-actions">
          <button onClick={selectAllLayers} className="quick-action-btn">เปิดทั้งหมด</button>
          <button onClick={selectNoneLayers} className="quick-action-btn">ปิดทั้งหมด</button>
        </div>
        <div className="layers-grid">
          {[
            { key: 'lst',      label: 'LST',   grad: 'linear-gradient(135deg,#fee08b,#d73027)' },
            { key: 'ch4',      label: 'CH₄',   grad: 'linear-gradient(135deg,#ddd6fe,#7c3aed)' },
            { key: 'co',       label: 'CO',    grad: 'linear-gradient(135deg,#fed7aa,#ea580c)' },
            { key: 'no2',      label: 'NO₂',   grad: 'linear-gradient(135deg,#fecdd3,#be123c)' },
            { key: 'o3',       label: 'O₃',    grad: 'linear-gradient(135deg,#bae6fd,#0369a1)' },
            { key: 'boundary', label: 'เขต',   grad: 'linear-gradient(135deg,#e2e8f0,#94a3b8)' },
            { key: 'predict',  label: 'ทำนาย LST 2027', grad: 'linear-gradient(135deg,#8ef3a7,#34c759)', special: true },
          ].map(l => (
            <button
              key={l.key}
              className={`layer-btn btn-${l.key} ${layers[l.key] ? 'active' : ''}${l.special ? ' layer-btn-predict' : ''}`}
              onClick={() => toggleLayer?.(l.key)}
              title={l.key === 'predict' ? 'LST Predicted 2027 (รายอำเภอ)' : l.key}
            >
              <span className="btn-dot" style={{ background: l.grad }} />
              <span>{l.label}</span>
            </button>
          ))}
        </div>

        <div className="layer-section-title" style={{ marginTop: '10px' }}>แผนที่ฐาน</div>
        <div className="basemap-controls">
          {[
            { id: 'dark',      label: 'ปัจจุบัน' },
            { id: 'satellite', label: 'ดาวเทียม' },
            { id: 'city',      label: 'เมือง' }
          ].map(b => (
            <button
              key={b.id}
              className={`basemap-btn ${activeBasemap === b.id ? 'active' : ''}`}
              onClick={() => setActiveBasemap(b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
