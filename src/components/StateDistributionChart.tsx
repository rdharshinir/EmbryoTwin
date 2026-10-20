import React, { useState } from 'react';
import { StateCurvePoint } from '../model/probabilisticModel';
import { LineChart, BarChart2, Info } from 'lucide-react';

interface StateDistributionChartProps {
  trajectories: StateCurvePoint[];
  currentHpi: number;
  setCurrentHpi: (hpi: number) => void;
}

export const StateDistributionChart: React.FC<StateDistributionChartProps> = ({
  trajectories,
  currentHpi,
  setCurrentHpi
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const maxHpi = 144;

  const getX = (t: number) => padding.left + (t / maxHpi) * plotW;
  const getY = (p: number) => padding.top + (1.0 - p) * plotH;

  // Path generator for continuous state curves
  const makePath = (key: keyof StateCurvePoint) => {
    return trajectories.reduce((acc, pt, i) => {
      const x = getX(pt.timeHpi);
      const y = getY(pt[key] as number);
      return i === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
    }, "");
  };

  // State configurations with distinct biological palette
  const stateConfigs = [
    { key: 'zygote', label: 'Zygote', color: '#94a3b8' },
    { key: 'twoCell', label: '2-Cell', color: '#38bdf8' },
    { key: 'threeCell', label: '3-Cell', color: '#0ea5e9' },
    { key: 'fourCell', label: '4-Cell', color: '#6366f1' },
    { key: 'fiveToEightCell', label: '5-8 Cell', color: '#8b5cf6' },
    { key: 'morula', label: 'Morula', color: '#a855f7' },
    { key: 'earlyBlast', label: 'Early Blast', color: '#ec4899' },
    { key: 'fullBlast', label: 'Full Blast', color: '#10b981' },
    { key: 'expandedBlast', label: 'Expanded/Hatch', color: '#059669' },
    { key: 'arrestCleavage', label: 'Cleavage Arrest', color: '#ef4444', isDashed: true },
    { key: 'arrestMorula', label: 'Morula Arrest', color: '#dc2626', isDashed: true },
  ];

  // Find data point nearest to currentHpi
  const currentPt = trajectories.reduce((prev, curr) =>
    Math.abs(curr.timeHpi - currentHpi) < Math.abs(prev.timeHpi - currentHpi) ? curr : prev
  );

  return (
    <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl backdrop-blur-md flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <LineChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Probabilistic State Evolution Curves
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                P(S_t = s)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Markovian state probability distributions across elapsed hours post-insemination
            </p>
          </div>
        </div>

        {/* Current State Odds Summary */}
        <div className="flex items-center gap-2 text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-slate-400">At {currentHpi.toFixed(1)}h:</span>
          <span className="font-mono font-bold text-emerald-400">
            Viable: {((1 - currentPt.arrestCleavage - currentPt.arrestMorula - currentPt.arrestBlast) * 100).toFixed(0)}%
          </span>
          <span className="text-slate-500">|</span>
          <span className="font-mono font-bold text-red-400">
            Arrest: {((currentPt.arrestCleavage + currentPt.arrestMorula + currentPt.arrestBlast) * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none cursor-crosshair"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = (clickX / rect.width) * width;
            const plotClickX = Math.max(padding.left, Math.min(padding.left + plotW, ratio));
            const t = ((plotClickX - padding.left) / plotW) * maxHpi;
            setCurrentHpi(Math.round(t * 10) / 10);
          }}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((prob) => (
            <g key={`y-grid-${prob}`}>
              <line
                x1={padding.left}
                y1={getY(prob)}
                x2={padding.left + plotW}
                y2={getY(prob)}
                stroke="#1e293b"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={getY(prob) + 3}
                fill="#64748b"
                fontSize="10"
                textAnchor="end"
                fontFamily="monospace"
              >
                {(prob * 100).toFixed(0)}%
              </text>
            </g>
          ))}

          {/* Time markers (0, 24, 48, 72, 96, 120, 144) */}
          {[0, 24, 48, 72, 96, 120, 144].map((t) => (
            <g key={`x-grid-${t}`}>
              <line
                x1={getX(t)}
                y1={padding.top}
                x2={getX(t)}
                y2={padding.top + plotH}
                stroke="#1e293b"
                strokeWidth="1"
              />
              <text
                x={getX(t)}
                y={padding.top + plotH + 16}
                fill="#64748b"
                fontSize="10"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {t}h
              </text>
            </g>
          ))}

          {/* Continuous state probability lines */}
          {stateConfigs.map((cfg) => (
            <path
              key={cfg.key}
              d={makePath(cfg.key as keyof StateCurvePoint)}
              fill="none"
              stroke={cfg.color}
              strokeWidth={cfg.key === 'fullBlast' || cfg.key === 'expandedBlast' ? 2.5 : 1.8}
              strokeDasharray={cfg.isDashed ? "4 4" : undefined}
              opacity="0.85"
            />
          ))}

          {/* Current HPI vertical cursor */}
          <line
            x1={getX(currentHpi)}
            y1={padding.top}
            x2={getX(currentHpi)}
            y2={padding.top + plotH}
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Legend Grid */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
        {stateConfigs.map((cfg) => (
          <span key={cfg.key} className="flex items-center gap-1.5">
            <span
              className="w-3 h-1 rounded"
              style={{
                backgroundColor: cfg.color,
                borderStyle: cfg.isDashed ? 'dashed' : 'solid'
              }}
            />
            {cfg.label}
          </span>
        ))}
      </div>
    </div>
  );
};
