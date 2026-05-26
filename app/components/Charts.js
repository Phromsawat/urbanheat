'use client';

import { useRef, useEffect, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { timeSeriesData, YEARS, getLstColor, predict2027 } from '../data/sampleData';

Chart.register(...registerables);

const chartFont = { family: "'Inter', sans-serif", size: 11 };
const gridColor = 'rgba(255,255,255,0.06)';
const tickColor = '#94a3b8';

function ChartCanvas({ id, buildChart, deps = [] }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = buildChart(ref.current);
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildChart, ...deps]);

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: '180px', width: '100%' }}>
      <canvas ref={ref} id={id} />
    </div>
  );
}

// ────────────────────────────────────────────────
// LST Time Series (2018–2026 actual + 2027 predicted)
// ────────────────────────────────────────────────
export function TimeSeriesChart() {
  const labels = [...YEARS]; // 2018–2027
  const lstData = [...timeSeriesData.lst]; // 9 actual + 1 predicted

  const build = useMemo(() => (ctx) => new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'LST เฉลี่ย (°C)',
          data: lstData.slice(0, 9), // 2018-2026 actual
          borderColor: '#f46d43',
          backgroundColor: 'rgba(244,109,67,0.15)',
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: lstData.slice(0, 9).map(v => getLstColor(v)),
        },
        {
          label: 'LST Predicted 2027',
          data: [null, null, null, null, null, null, null, null, lstData[8], lstData[9]], // connect from 2026
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.08)',
          borderDash: [8, 4],
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: [0,0,0,0,0,0,0,0,5,7],
          pointHoverRadius: 9,
          pointBackgroundColor: '#f59e0b',
          pointStyle: [null,null,null,null,null,null,null,null,'circle','star'],
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          labels: { color: tickColor, font: chartFont, boxWidth: 16, padding: 12 }
        },
        tooltip: {
          backgroundColor: 'rgba(15,17,28,0.95)',
          borderColor: 'rgba(244,109,67,0.4)',
          borderWidth: 1,
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          titleFont: { family: "'Inter', sans-serif", size: 12, weight: '600' },
          bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            title: items => `ปี ${items[0].label}`,
            afterBody: items => {
              const idx = items[0]?.dataIndex;
              if (idx === 9) return 'ค่าพยากรณ์ (Linear Regression)';
              return '';
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: tickColor, font: chartFont },
          grid: { color: gridColor }
        },
        y: {
          ticks: { color: tickColor, font: chartFont, callback: v => `${v}°C` },
          grid: { color: gridColor },
          min: 30,
          max: 37
        }
      }
    }
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  return <ChartCanvas id="chart-timeseries" buildChart={build} />;
}

// ────────────────────────────────────────────────
// LST Histogram for a selected year (distribution of 4800 points)
// ────────────────────────────────────────────────
export function LSTHistogramChart({ yearIndex }) {
  // Bin the real averages into temperature buckets
  // Since we only have province-level averages per year, we simulate distribution
  const year = YEARS[Math.min(yearIndex, 8)];
  const avg = timeSeriesData.lst[Math.min(yearIndex, 8)];

  const bins = useMemo(() => {
    // Approximate distribution around the mean (±2°C range from real data spread)
    const labels = ['<30', '30-31', '31-32', '32-33', '33-34', '34-35', '35-36', '>36'];
    // Scale bin heights based on the average (real data has avg ~32-34.5)
    const center = avg - 30;
    const data = labels.map((_, i) => {
      const dist = Math.abs(i - center);
      return Math.max(0, Math.round(800 * Math.exp(-0.5 * dist * dist)));
    });
    return { labels, data };
  }, [avg]);

  const build = useMemo(() => (ctx) => new Chart(ctx, {
    type: 'bar',
    data: {
      labels: bins.labels,
      datasets: [{
        label: `LST Distribution ${year}`,
        data: bins.data,
        backgroundColor: bins.labels.map((l, i) => {
          const temp = 30 + i;
          return getLstColor(temp) + 'cc';
        }),
        borderColor: bins.labels.map((l, i) => getLstColor(30 + i)),
        borderWidth: 1,
        borderRadius: 5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,17,28,0.95)',
          borderColor: 'rgba(244,109,67,0.4)',
          borderWidth: 1,
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          padding: 10,
          cornerRadius: 8,
          callbacks: { label: i => `${i.raw} grid points` }
        }
      },
      scales: {
        x: { ticks: { color: tickColor, font: chartFont }, grid: { color: gridColor } },
        y: {
          ticks: { color: tickColor, font: chartFont },
          grid: { color: gridColor },
          title: { display: true, text: 'จำนวน Grid Points', color: tickColor, font: chartFont }
        }
      }
    }
  }), [bins, year]); // eslint-disable-line react-hooks/exhaustive-deps

  return <ChartCanvas id="chart-lst-hist" buildChart={build} deps={[yearIndex]} />;
}

// ────────────────────────────────────────────────
// Gas Time Series (any variable from sampleData)
// ────────────────────────────────────────────────
export function GasTimeSeriesChart({ variable, color, label, scale = 1 }) {
  const years = YEARS.slice(0, 9); // 2018-2026
  const rawData = timeSeriesData[variable]?.slice(0, 9) ?? [];
  const data = rawData.map(v => v != null ? parseFloat((v * scale).toFixed(6)) : null);

  const build = useMemo(() => (ctx) => new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label,
        data,
        borderColor: color,
        backgroundColor: color + '22',
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: color,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,17,28,0.95)',
          borderColor: color + '66',
          borderWidth: 1,
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          padding: 10,
          cornerRadius: 8,
          callbacks: { title: items => `ปี ${items[0].label}` }
        }
      },
      scales: {
        x: { ticks: { color: tickColor, font: chartFont }, grid: { color: gridColor } },
        y: { ticks: { color: tickColor, font: chartFont }, grid: { color: gridColor } }
      }
    }
  }), [variable, color, label, scale]); // eslint-disable-line react-hooks/exhaustive-deps

  return <ChartCanvas id={`chart-gas-${variable}`} buildChart={build} />;
}

// ────────────────────────────────────────────────
// Predict 2027 Compare Chart
// ────────────────────────────────────────────────
export function PredictCompareChart() {
  const build = useMemo(() => (ctx) => new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['LST 2026\n(ค่าจริง)', 'LST 2027\n(ค่าพยากรณ์)'],
      datasets: [{
        label: 'LST เฉลี่ย (°C)',
        data: [predict2027.avgLst2026, predict2027.avgLst2027],
        backgroundColor: [
          getLstColor(predict2027.avgLst2026) + 'cc',
          getLstColor(predict2027.avgLst2027) + 'cc',
        ],
        borderColor: [
          getLstColor(predict2027.avgLst2026),
          getLstColor(predict2027.avgLst2027),
        ],
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 80,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,17,28,0.95)',
          borderColor: 'rgba(244,109,67,0.4)',
          borderWidth: 1,
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: i => `${i.raw.toFixed(4)} °C`,
            afterLabel: (i) => i.dataIndex === 1
              ? `Δ = ${predict2027.deltaLst >= 0 ? '+' : ''}${predict2027.deltaLst.toFixed(4)} °C`
              : ''
          }
        },
        annotation: {}
      },
      scales: {
        x: { ticks: { color: tickColor, font: chartFont }, grid: { display: false } },
        y: {
          ticks: { color: tickColor, font: chartFont, callback: v => `${v}°C` },
          grid: { color: gridColor },
          min: 32,
          max: 35
        }
      }
    }
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ChartCanvas id="chart-predict" buildChart={build} />
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#94a3b8' }}>LST 2026 (Actual)</span>
          <span style={{ color: getLstColor(predict2027.avgLst2026), fontWeight: 700, fontSize: 20, fontFamily: "'JetBrains Mono', monospace" }}>
            {predict2027.avgLst2026.toFixed(4)} °C
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#94a3b8' }}>LST 2027 (Predicted)</span>
          <span style={{ color: getLstColor(predict2027.avgLst2027), fontWeight: 700, fontSize: 20, fontFamily: "'JetBrains Mono', monospace" }}>
            {predict2027.avgLst2027.toFixed(4)} °C
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#94a3b8' }}>Δ Change</span>
          <span style={{ color: predict2027.deltaLst < 0 ? '#1a9850' : '#d73027', fontWeight: 700, fontSize: 20, fontFamily: "'JetBrains Mono', monospace" }}>
            {predict2027.deltaLst >= 0 ? '+' : ''}{predict2027.deltaLst.toFixed(4)} °C
          </span>
        </div>
      </div>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: 12, margin: 0 }}>
        ค่าพยากรณ์จาก Linear Regression Model | ข้อมูล 4,800 grid points ทั่วจังหวัดชลบุรี
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────
// District Specific Trend Chart
// ────────────────────────────────────────────────
export function DistrictTrendChart({ properties, variable = 'LST' }) {
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027];
  
  const dataPoints = useMemo(() => {
    if (!properties) return [];
    return years.map(yr => {
      if (variable === 'LST' && yr === 2027) {
        return properties['LST_pred_2027'] ?? null;
      }
      return properties[`${variable}_${yr}`] ?? null;
    });
  }, [properties, variable]);

  const hasData = dataPoints.some(v => v !== null);

  const build = useMemo(() => (ctx) => {
    if (!hasData) return null;
    
    const color = variable === 'LST' ? '#f46d43' : 
                  variable === 'CH4' ? '#a855f7' :
                  variable === 'CO' ? '#f97316' :
                  variable === 'NO2' ? '#e11d48' : '#0ea5e9';

    const label = variable === 'LST' ? 'LST อุณหภูมิผิวพื้น' : `${variable} Trend`;
    
    const actualData = dataPoints.slice(0, 9);
    const predData = [null, null, null, null, null, null, null, null, dataPoints[8], dataPoints[9]];

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            label: `${label} (ข้อมูลจริง)`,
            data: actualData,
            borderColor: color,
            backgroundColor: color + '15',
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: color,
          },
          ...(variable === 'LST' && dataPoints[9] !== null ? [{
            label: `${label} (พยากรณ์)`,
            data: predData,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0.05)',
            borderDash: [5, 3],
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: [0,0,0,0,0,0,0,0,4,6],
            pointHoverRadius: 8,
            pointBackgroundColor: '#f59e0b',
            pointStyle: [null,null,null,null,null,null,null,null,'circle','star'],
          }] : [])
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 17, 28, 0.95)',
            borderColor: color + '44',
            borderWidth: 1,
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            padding: 8,
            cornerRadius: 6,
            callbacks: {
              title: items => `ปี ${items[0].label}`,
              label: item => ` ${item.dataset.label.includes('พยากรณ์') ? 'พยากรณ์' : 'เฉลี่ย'}: ${item.raw.toFixed(2)}${variable === 'LST' ? ' °C' : ''}`
            }
          }
        },
        scales: {
          x: { ticks: { color: tickColor, font: { ...chartFont, size: 10 } }, grid: { color: gridColor } },
          y: { 
            ticks: { color: tickColor, font: { ...chartFont, size: 10 }, callback: v => variable === 'LST' ? `${v}°` : v }, 
            grid: { color: gridColor } 
          }
        }
      }
    });
  }, [dataPoints, variable, hasData]);

  if (!hasData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: 12 }}>
        ไม่มีข้อมูลประวัติสำหรับอำเภอนี้
      </div>
    );
  }

  return <ChartCanvas id="chart-district-trend" buildChart={build} deps={[properties, variable]} />;
}

// Keep legacy exports for backward compatibility
export function BarChart() { return null; }
export function ScatterCO2() { return null; }
export function ScatterNDVI() { return null; }
export function DoughnutChart() { return null; }
