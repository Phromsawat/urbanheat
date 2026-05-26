'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { YEARS, timeSeriesData, getLstColor } from '../data/sampleData';
import { Play, Pause } from 'lucide-react';

// Only years with map data (2018-2026 = index 0-8)
// Index 9 = 2027 (predicted — map shows predict layer)
const MAP_YEARS = YEARS; // 2018–2027

export default function Timeline({ yearIndex, onYearChange }) {
  const [playing, setPlaying] = useState(false);
  const maxIndex = MAP_YEARS.length - 1; // 9

  useEffect(() => {
    if (!playing) return;

    const timer = setInterval(() => {
      onYearChange(prev => (prev + 1) % (maxIndex + 1));
    }, 1200);

    return () => clearInterval(timer);
  }, [playing, maxIndex, onYearChange]);

  const handlePlay = useCallback(() => {
    setPlaying(prev => !prev);
  }, []);

  const pct = (yearIndex / maxIndex) * 100;
  const currentLst = timeSeriesData.lst[Math.min(yearIndex, 8)];
  const isPredicted = yearIndex === 9;

  return (
    <div className="timeline-overlay">
      <div className="timeline-container">
        <button
          className={`timeline-btn ${playing ? 'playing' : ''}`}
          onClick={handlePlay}
          title="Play/Pause"
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <div className="timeline-track">
          <div className="timeline-years">
            {MAP_YEARS.map((y, i) => (
              <span
                key={y}
                className={`${i === yearIndex ? 'active' : ''} ${i === 9 ? 'predicted' : ''}`}
                onClick={() => onYearChange(i)}
                title={i === 9 ? 'ค่าพยากรณ์ 2027' : `ปี ${y}`}
              >
                {y}
              </span>
            ))}
          </div>
          <input
            type="range"
            min="0"
            max={maxIndex}
            value={yearIndex}
            step="1"
            onChange={e => onYearChange(parseInt(e.target.value))}
            style={{
              background: `linear-gradient(to right, #1c1c1e 0%, #1c1c1e ${pct}%, #e5e5ea ${pct}%, #e5e5ea 100%)`
            }}
          />
        </div>

        <div className="timeline-label">
          <span
            className="timeline-year-display"
            style={{ color: '#34c759' }}
          >
            {MAP_YEARS[yearIndex]}
          </span>
          {isPredicted && (
            <span style={{ fontSize: 10, color: '#34c759', marginTop: 2 }}>Predicted</span>
          )}
        </div>
      </div>
    </div>
  );
}
