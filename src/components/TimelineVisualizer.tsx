import React, { useRef, useEffect } from 'react';
import { MilestonePrediction } from '../model/probabilisticModel';
import { Play, Pause, RotateCcw, Clock, AlertCircle } from 'lucide-react';

interface TimelineVisualizerProps {
  currentHpi: number;
  setCurrentHpi: (val: number) => void;
  milestones: Record<string, MilestonePrediction>;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  woiCenterHpi: number;
  woiWidthHours: number;
}

export const TimelineVisualizer: React.FC<TimelineVisualizerProps> = ({
  currentHpi,
  setCurrentHpi,
  milestones,
  isPlaying,
  setIsPlaying,
  woiCenterHpi,
  woiWidthHours
}) => {
  const maxHpi = 144;
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation play loop
  useEffect(() => {
    let animId: number;
    if (isPlaying) {
      const step = () => {
        setCurrentHpi((prev) => {
          if (prev >= maxHpi) {
            setIsPlaying(false);
            return maxHpi;
          }
          return Math.min(maxHpi, prev + 0.35);
        });
        animId = requestAnimationFrame(step);
      };
      animId = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, setCurrentHpi, setIsPlaying]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setCurrentHpi(Math.round(ratio * maxHpi * 10) / 10);
  };

  const dayMarkers = [
    { label: "Day 1 (Fertilization)", start: 0, end: 24, color: "border-slate-700" },
    { label: "Day 2 (Cleavage)", start: 24, end: 48, color: "border-slate-700" },
    { label: "Day 3 (8-Cell)", start: 48, end: 72, color: "border-slate-700" },
    { label: "Day 4 (Morula)", start: 72, end: 96, color: "border-slate-700" },
    { label: "Day 5 (Blastocyst)", start: 96, end: 120, color: "border-indigo-600/50" },
    { label: "Day 6 (Expanded)", start: 120, end: 144, color: "border-purple-600/50" }
  ];

  const woiStartPct = ((woiCenterHpi - woiWidthHours / 2) / maxHpi) * 100;
  const woiWidthPct = (woiWidthHours / maxHpi) * 100;

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl backdrop-blur-md">
      {/* Timeline Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Time-Lapse Morphokinetic Trajectory
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                0 - 144 hpi
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive temporal timeline with Bayesian 95% Credible Intervals & Uterine Implantation Window
            </p>
          </div>
        </div>

        {/* Play / Pause / Reset / Value */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 mr-2">Elapsed:</span>
            <span className="font-mono text-base font-bold text-indigo-400">{currentHpi.toFixed(1)}</span>
            <span className="text-xs text-slate-400 ml-1">hpi</span>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md ${
              isPlaying
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                : "bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-500"
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? "Pause Twin" : "Simulate Forward"}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentHpi(0);
            }}
            title="Reset to 0 hpi"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Timeline Bar */}
      <div className="relative pt-6 pb-12 select-none" ref={containerRef} onClick={handleTimelineClick}>
        {/* Day Bracket Divisions */}
        <div className="absolute top-0 inset-x-0 flex text-[10px] font-mono text-slate-400 border-b border-slate-800">
          {dayMarkers.map((day, idx) => (
            <div
              key={idx}
              className={`flex-1 text-center py-1 border-r ${day.color} last:border-r-0 truncate px-1`}
            >
              {day.label}
            </div>
          ))}
        </div>

        {/* The Track Container */}
        <div className="relative mt-8 h-10 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden cursor-pointer shadow-inner">
          {/* Uterine Window of Implantation Receptivity Highlight */}
          <div
            className="absolute top-0 bottom-0 bg-emerald-500/15 border-x border-emerald-500/40 flex items-center justify-center pointer-events-none"
            style={{
              left: `${woiStartPct}%`,
              width: `${woiWidthPct}%`
            }}
          >
            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400/90 whitespace-nowrap px-1">
              Window of Implantation (WOI)
            </span>
          </div>

          {/* Progress Elapsed Fill */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-900/60 via-indigo-600/40 to-indigo-500/60 pointer-events-none"
            style={{ width: `${(currentHpi / maxHpi) * 100}%` }}
          />

          {/* Grid lines every 12 hours */}
          {Array.from({ length: 13 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-slate-800/80 pointer-events-none"
              style={{ left: `${(i * 12 / maxHpi) * 100}%` }}
            />
          ))}

          {/* Milestone 95% Credible Interval Bands (Fan Charts) */}
          {Object.entries(milestones).map(([key, m]) => {
            if (m.isObserved || m.mean > maxHpi) return null;
            const ciLeft = Math.max(0, (m.ciLower / maxHpi) * 100);
            const ciRight = Math.min(100, (m.ciUpper / maxHpi) * 100);
            const ciWidth = ciRight - ciLeft;

            return (
              <div
                key={`ci-${key}`}
                className="absolute top-1 bottom-1 bg-cyan-400/15 border-t border-b border-cyan-400/30 pointer-events-none rounded"
                style={{ left: `${ciLeft}%`, width: `${ciWidth}%` }}
                title={`${m.name} 95% CI: ${m.ciLower}h - ${m.ciUpper}h`}
              />
            );
          })}

          {/* Milestone Point Markers */}
          {Object.entries(milestones).map(([key, m]) => {
            if (m.mean > maxHpi) return null;
            const leftPct = (m.mean / maxHpi) * 100;
            const isPast = m.mean <= currentHpi;

            return (
              <div
                key={key}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none group/marker"
                style={{ left: `${leftPct}%` }}
              >
                {/* Marker dot */}
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-transform duration-200 group-hover/marker:scale-150 ${
                    m.isObserved
                      ? "bg-emerald-400 border-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                      : isPast
                      ? "bg-indigo-400 border-indigo-200"
                      : "bg-cyan-400 border-cyan-100 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                  }`}
                />

                {/* Milestone Label Badge below */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-auto">
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shadow-sm ${
                      m.isObserved
                        ? "bg-emerald-950/90 text-emerald-300 border-emerald-700/60"
                        : "bg-slate-900/90 text-cyan-300 border-cyan-800/60"
                    }`}
                  >
                    {key}: {m.mean.toFixed(1)}h
                  </span>
                </div>
              </div>
            );
          })}

          {/* Current Scrub Head Handle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,1)] pointer-events-none z-10"
            style={{ left: `${(currentHpi / maxHpi) * 100}%` }}
          >
            {/* Top pointer knob */}
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-2 border-indigo-600 shadow-lg cursor-grab" />
            {/* Bottom pointer tag */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-indigo-600 text-[10px] font-mono text-white font-bold whitespace-nowrap shadow-md">
              T = {currentHpi.toFixed(1)}h
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 mt-7 px-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Observed Checkpoint (Sensor / Embryologist)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              Bayesian Predicted Timing (Posterior Mean)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-2 rounded bg-cyan-400/30 border border-cyan-400/50" />
              95% Credible Interval Band
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-3 h-2 rounded bg-emerald-500/20 border border-emerald-500/40" />
            Endometrial Implantation Window (WOI)
          </div>
        </div>
      </div>
    </div>
  );
};
