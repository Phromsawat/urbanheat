'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Flame, Thermometer, Trees, Cloud, BarChart3, PanelLeft, TrendingDown, TrendingUp, ChevronDown, SlidersHorizontal, Info, Leaf, Wind, Layers } from 'lucide-react';
import { timeSeriesData, YEARS, getLstColor, predict2027 } from '../data/sampleData';
import Timeline from './Timeline';
import { TimeSeriesChart, LSTHistogramChart, GasTimeSeriesChart, PredictCompareChart, DistrictTrendChart } from './Charts';

const MapView = dynamic(() => import('./MapView'), { ssr: false, loading: () => <div id="map" style={{ background: '#0b0d14' }} /> });

// DATA_YEARS matches the shapefile years (2018-2026, index 0-8; 2027 predicted at index 9)
const DATA_YEARS_COUNT = 9; // index 0–8 = 2018–2026

export default function Dashboard() {
  const [yearIndex, setYearIndex] = useState(8); // default: 2026 (index 8)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [simCo2, setSimCo2] = useState(0);
  const [simGreen, setSimGreen] = useState(0);
  const [layers, setLayers] = useState({
    lst: true, ch4: false, co: false, no2: false, o3: false, boundary: true, predict: false
  });
  const [singleMode, setSingleMode] = useState(false);
  const [activeChart, setActiveChart] = useState('lst'); // 'lst' | 'gas' | 'predict'

  const toggleLayer = (name) => {
    setLayers(prev => {
      if (name === 'boundary') {
        return { ...prev, boundary: !prev.boundary };
      }
      if (singleMode) {
        const nextVal = !prev[name];
        return {
          lst: name === 'lst' ? nextVal : false,
          ch4: name === 'ch4' ? nextVal : false,
          co: name === 'co' ? nextVal : false,
          no2: name === 'no2' ? nextVal : false,
          o3: name === 'o3' ? nextVal : false,
          predict: name === 'predict' ? nextVal : false,
          boundary: prev.boundary,
        };
      }
      return { ...prev, [name]: !prev[name] };
    });
  };

  const enableSingleMode = () => {
    setSingleMode(true);
    setLayers(prev => {
      const activeKeys = ['lst', 'ch4', 'co', 'no2', 'o3', 'predict'];
      const firstActive = activeKeys.find(k => prev[k]) || 'lst';
      return {
        lst: firstActive === 'lst',
        ch4: firstActive === 'ch4',
        co: firstActive === 'co',
        no2: firstActive === 'no2',
        o3: firstActive === 'o3',
        predict: firstActive === 'predict',
        boundary: prev.boundary,
      };
    });
  };

  const selectAllLayers = () => {
    setSingleMode(false);
    setLayers(prev => ({
      lst: true, ch4: true, co: true, no2: true, o3: true, predict: true,
      boundary: prev.boundary
    }));
  };

  const selectNoneLayers = () => {
    setLayers(prev => ({
      lst: false, ch4: false, co: false, no2: false, o3: false, predict: false,
      boundary: prev.boundary
    }));
  };

  const tempDrop = useMemo(() => (simCo2 * 0.03 + simGreen * 0.05).toFixed(1), [simCo2, simGreen]);

  const stats = useMemo(() => {
    const idx = Math.min(yearIndex, DATA_YEARS_COUNT - 1);
    return {
      lst:  (timeSeriesData.lst[idx] ?? 0).toFixed(2),
      ch4:  (timeSeriesData.ch4[idx] ?? 0).toFixed(1),
      co:   ((timeSeriesData.co[idx] ?? 0) * 1000).toFixed(4),
      no2:  ((timeSeriesData.no2[idx] ?? 0) * 1e6).toFixed(4),
    };
  }, [yearIndex]);

  const insights = useMemo(() => ({
    lst: `${(timeSeriesData.lst[8] - timeSeriesData.lst[0]) >= 0 ? '+' : ''}${(timeSeriesData.lst[8] - timeSeriesData.lst[0]).toFixed(2)}°C`,
    ch4: `+${(timeSeriesData.ch4[8] - timeSeriesData.ch4[0]).toFixed(1)} ppb`,
    lst2027: predict2027.deltaLst >= 0 ? `+${predict2027.deltaLst.toFixed(2)}°C` : `${predict2027.deltaLst.toFixed(2)}°C`,
  }), []);

  const handleZoneSelect = useCallback((props) => {
    setSelectedZone(props);
    if (!dashboardOpen) setDashboardOpen(true);
  }, [dashboardOpen]);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-text">
              <h1>CitySweat</h1>
              <span className="logo-sub">GHG &amp; LST Analysis</span>
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-label"><Info size={14} /><span>ข้อมูลโปรเจค</span></div>
          <div className="info-card">
            <div className="info-row"><span className="info-label">พื้นที่ศึกษา</span><span className="info-value">ชลบุรี</span></div>
            <div className="info-row"><span className="info-label">ดาวเทียม LST</span><span className="info-value">MODIS</span></div>
            <div className="info-row"><span className="info-label">ดาวเทียม GHG</span><span className="info-value">Sentinel-5P</span></div>
            <div className="info-row"><span className="info-label">รูปแบบข้อมูล</span><span className="info-value">11 อำเภอ (รายเขต)</span></div>
            <div className="info-row"><span className="info-label">จุดข้อมูลเดิม</span><span className="info-value">4,800 grid pts</span></div>
            <div className="info-row"><span className="info-label">ช่วงปี</span><span className="info-value">2018–2026 + 2027</span></div>
            <div className="info-row"><span className="info-label">Model</span><span className="info-value">Random Forest Regression</span></div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-label"><Thermometer size={14} /><span>LST Legend (°C)</span></div>
          <div className="legend">
            {[
              { color: '#313695', text: '< 28 — เย็น' },
              { color: '#74add1', text: '28–32 — ปกติ' },
              { color: '#fee08b', text: '32–34 — อุ่น' },
              { color: '#f46d43', text: '34–36 — ร้อน' },
              { color: '#d73027', text: '36–38 — ร้อนมาก' },
              { color: '#a50026', text: '> 38 — อันตราย' },
            ].map(l => (
              <div key={l.color} className="legend-item">
                <span className="legend-color" style={{ background: l.color }} />
                <span>{l.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-label"><BarChart3 size={14} /><span>ค่าเฉลี่ยทั้งจังหวัด ({YEARS[Math.min(yearIndex, 8)]})</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: 'rgba(215,48,39,0.04)', border: '1px solid rgba(215,48,39,0.1)', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)' }}>🌡 LST เฉลี่ย {parseFloat(tempDrop) > 0 ? '(เดิม)' : ''}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-main)', color: getLstColor(parseFloat(stats.lst)) }}>{stats.lst}°C</span>
              {parseFloat(tempDrop) > 0 && (
                <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-main)', color: getLstColor(parseFloat(stats.lst) - parseFloat(tempDrop)), borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: '2px', marginTop: '2px' }}>
                  📉 จำลอง: {(parseFloat(stats.lst) - parseFloat(tempDrop)).toFixed(2)}°C
                </span>
              )}
            </div>
            <div style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.1)', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)' }}>☁ CH₄ เฉลี่ย</span>
              <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-main)', color: '#a855f7' }}>{stats.ch4} ppb</span>
            </div>
            <div style={{ background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.1)', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)' }}>💨 CO เฉลี่ย {simCo2 > 0 ? '(เดิม)' : ''}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-main)', color: '#f97316' }}>{stats.co} ×10⁻³</span>
              {simCo2 > 0 && (
                <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-main)', color: '#166534', borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: '2px', marginTop: '2px' }}>
                  📉 จำลอง: {(parseFloat(stats.co) * (1 - simCo2 / 100)).toFixed(4)} ×10⁻³
                </span>
              )}
            </div>
            <div style={{ background: 'rgba(225,29,72,0.04)', border: '1px solid rgba(225,29,72,0.1)', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-secondary)' }}>🌫 NO₂ เฉลี่ย</span>
              <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-main)', color: '#e11d48' }}>{stats.no2} µ</span>
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-label"><SlidersHorizontal size={14} /><span>จำลองลดก๊าซ (Simulation)</span></div>
          <div className="sim-control">
            <label className="sim-label">ลด CO (×10⁻³) (%)</label>
            <input type="range" min="0" max="50" value={simCo2} onChange={e => setSimCo2(parseInt(e.target.value))} className="sim-slider" />
            <span className="sim-value">{simCo2}%</span>
          </div>
          <div className="sim-control">
            <label className="sim-label">เพิ่มพื้นที่สีเขียว (%)</label>
            <input type="range" min="0" max="50" value={simGreen} onChange={e => setSimGreen(parseInt(e.target.value))} className="sim-slider" />
            <span className="sim-value">{simGreen}%</span>
          </div>
          <div className="sim-result">
            <TrendingDown size={16} />
            <span>อุณหภูมิลดลง: <strong>{tempDrop} °C</strong></span>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-label"><Layers size={14} /><span>Predict 2027</span></div>
          <div className="info-card">
            <div className="info-row"><span className="info-label">LST 2026 (Actual)</span><span className="info-value" style={{ color: getLstColor(predict2027.avgLst2026) }}>{predict2027.avgLst2026.toFixed(2)} °C</span></div>
            <div className="info-row"><span className="info-label">LST 2027 (Predicted)</span><span className="info-value" style={{ color: getLstColor(predict2027.avgLst2027) }}>{predict2027.avgLst2027.toFixed(2)} °C</span></div>
            <div className="info-row"><span className="info-label">Δ Change</span><span className="info-value" style={{ color: predict2027.deltaLst < 0 ? '#1a9850' : '#d73027' }}>{insights.lst2027}</span></div>
          </div>
        </div>

        <div className="sidebar-footer"><span>Mini Project Y4/T2 — 2026</span></div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <PanelLeft size={18} />
          </button>
          <div className="topbar-title">
            <Flame size={16} />
            <span>Urban Heat Island &amp; Greenhouse Gas Analysis — ชลบุรี</span>
          </div>
          <div className="topbar-actions" />
        </div>

        <div className="map-area">
          <MapView 
            yearIndex={yearIndex} 
            onZoneSelect={handleZoneSelect} 
            layers={layers} 
            toggleLayer={toggleLayer}
            singleMode={singleMode}
            setSingleMode={setSingleMode}
            enableSingleMode={enableSingleMode}
            selectAllLayers={selectAllLayers}
            selectNoneLayers={selectNoneLayers}
            tempDrop={parseFloat(tempDrop)}
          />

          {/* Timeline - shows years 2018-2027 */}
          <Timeline yearIndex={yearIndex} onYearChange={setYearIndex} />


        </div>

        {/* Dashboard Panel */}
        <div className={`dashboard-panel ${!dashboardOpen ? 'collapsed' : ''}`}>
          <div className="panel-header" onClick={() => setDashboardOpen(!dashboardOpen)}>
            <div className="panel-title"><BarChart3 size={16} /><span>Data Science Dashboard — ข้อมูลจริงจาก Shapefile</span></div>
            <button className="panel-toggle"><ChevronDown size={16} /></button>
          </div>
          {dashboardOpen && (
            <div className="panel-content">
              {/* Chart Tab Switcher */}
              <div className="chart-tabs">
                {[
                  { id: 'lst',      label: 'LST Trend',     icon: <Thermometer size={13}/> },
                  { id: 'gas',      label: 'Gas Trends',    icon: <Cloud size={13}/> },
                  { id: 'predict',  label: 'Predict 2027',  icon: <Layers size={13}/> },
                  { id: 'notebook', label: 'Jupyter Code',   icon: <Info size={13}/> },
                  { id: 'slides',   label: 'Presentation',  icon: <Flame size={13}/> },
                ].map(tab => (
                  <button
                    key={tab.id}
                    className={`chart-tab-btn ${activeChart === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveChart(tab.id)}
                  >
                    {tab.icon}<span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="charts-grid">
                {activeChart === 'lst' && (
                  <>
                    <div className="chart-card wide">
                      <h3><TrendingUp size={14} /> LST Time Series 2018–2026 + Predicted 2027</h3>
                      <TimeSeriesChart />
                    </div>
                    <div className="chart-card">
                      <h3><BarChart3 size={14} /> LST Distribution (Histogram)</h3>
                      <LSTHistogramChart yearIndex={yearIndex} />
                    </div>
                  </>
                )}

                {activeChart === 'gas' && (
                  <>
                    <div className="chart-card wide">
                      <h3><Cloud size={14} /> CH₄ Trend 2018–2026 (ppb)</h3>
                      <GasTimeSeriesChart variable="ch4" color="#a855f7" label="CH₄ (ppb)" />
                    </div>
                    <div className="chart-card">
                      <h3><Wind size={14} /> CO Trend 2018–2026 (×10⁻³ mol/m²)</h3>
                      <GasTimeSeriesChart variable="co" color="#f97316" label="CO ×10⁻³" scale={1000} />
                    </div>
                    <div className="chart-card">
                      <h3> NO₂ Trend 2018–2026 (µmol/m²)</h3>
                      <GasTimeSeriesChart variable="no2" color="#e11d48" label="NO₂ µmol/m²" scale={1e6} />
                    </div>
                    <div className="chart-card">
                      <h3> O₃ Trend 2018–2026 (mol/m²)</h3>
                      <GasTimeSeriesChart variable="o3" color="#0ea5e9" label="O₃ mol/m²" />
                    </div>
                  </>
                )}

                {activeChart === 'predict' && (
                  <div className="chart-card wide">
                    <h3><Layers size={14} /> LST Actual 2026 vs Predicted 2027 (ค่าเฉลี่ยทั้งจังหวัด)</h3>
                    <PredictCompareChart />
                  </div>
                )}

                {activeChart === 'notebook' && (
                  <div className="chart-card wide" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: 0, paddingBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Info size={14} /> Jupyter Notebook — โค้ดวิจัยและการพยากรณ์ Random Forest (Python)</h3>
                    <iframe 
                      src="/notebook.html" 
                      style={{ 
                        width: '100%', 
                        flex: 1, 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '8px',
                        background: '#0f172a'
                      }} 
                    />
                  </div>
                )}

                {activeChart === 'slides' && (
                  <div className="chart-card wide" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: 0, paddingBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Flame size={14} /> สไลด์นำเสนอระบบ — CitySweat Web Architecture &amp; Code Showcase</h3>
                    <iframe 
                      src="/slides.html" 
                      style={{ 
                        width: '100%', 
                        flex: 1, 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '8px',
                        background: '#08090e'
                      }} 
                    />
                  </div>
                )}

                {/* Zone Detail — always shown if a zone is selected */}
                {selectedZone && (
                  <div className="zone-detail animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1c1c1e', margin: 0 }}>
                          อำเภอ{selectedZone.name_th || selectedZone.name}
                        </h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedZone.name_en}</span>
                      </div>
                      <button 
                        onClick={() => setSelectedZone(null)}
                        style={{
                          background: '#f2f2f7', border: 'none', borderRadius: '50%', 
                          width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 16, fontWeight: 'bold',
                          transition: 'background var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#e5e5ea'}
                        onMouseLeave={(e) => e.target.style.background = '#f2f2f7'}
                      >
                        &times;
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'start' }}>
                      {/* Left: Stats grid */}
                      <div className="zone-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                        {['LST', 'CH4', 'CO', 'NO2', 'O3', 'SO2'].map(key => {
                          const dataKey = `${key}_${YEARS[Math.min(yearIndex, 8)]}`;
                          const val = selectedZone[dataKey];
                          if (val == null) return null;
                          const units = { LST: '°C', CH4: ' ppb', CO: ' ×10⁻³', NO2: ' µ', O3: ' mol/m²', SO2: ' mol/m²' };
                          const colors = { LST: getLstColor(val), CH4: '#a855f7', CO: '#f97316', NO2: '#e11d48', O3: '#0ea5e9', SO2: '#64748b' };
                          const label = { LST: '🌡 LST อุณหภูมิผิวพื้น', CH4: '☁ CH₄ (มีเทน)', CO: '💨 CO (คาร์บอนมอนอกไซด์)', NO2: '🌫 NO₂ (ไนโตรเจนไดออกไซด์)', O3: '☀️ O₃ (โอโซน)', SO2: '🏭 SO₂ (ซัลเฟอร์ไดออกไซด์)' };
                          
                          let displayVal = val;
                          if (key === 'CO') displayVal = (val * 1000).toFixed(4);
                          else if (key === 'NO2') displayVal = (val * 1e6).toFixed(3);
                          else if (typeof val === 'number') displayVal = val.toFixed(3);

                          return (
                            <div key={key} style={{ 
                              background: '#ffffff', 
                              border: '1px solid var(--border-color)',
                              borderRadius: '12px',
                              padding: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                            }}>
                              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label[key]}</span>
                              <span style={{ fontFamily: 'var(--font-code)', fontSize: '16px', fontWeight: 700, color: colors[key] }}>
                                {displayVal}{units[key]}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right: Trend Chart */}
                      <div style={{ 
                        background: '#ffffff', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '16px',
                        height: '240px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                      }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <TrendingUp size={14} style={{ color: '#f46d43' }} /> 
                          แนวโน้มอุณหภูมิ LST ประวัติศาสตร์และคาดการณ์
                        </h4>
                        <div style={{ flex: 1, minHeight: 0 }}>
                          <DistrictTrendChart properties={selectedZone} variable="LST" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Insights */}
                <div className="timeseries-section">
                  <div className="ts-header">
                    <div className="ts-title"><TrendingUp size={18} /><span>Key Insights (ข้อมูลจริง 2018–2026)</span></div>
                  </div>
                  <div className="ts-insights">
                    <div className="ts-insight"><Thermometer size={14} /><span>LST เปลี่ยนแปลง {insights.lst} ระหว่าง 2018–2026</span></div>
                    <div className="ts-insight"><Cloud size={14} /><span>CH₄ เพิ่มขึ้น {insights.ch4} ระหว่าง 2018–2026</span></div>
                    <div className="ts-insight"><Leaf size={14} /><span>LST คาดการณ์ 2027: {predict2027.avgLst2027.toFixed(2)} °C ({insights.lst2027} จากปี 2026)</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
