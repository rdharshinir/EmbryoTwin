import React from 'react';
import {
  TransferRecommendation,
  EndometrialCycle,
  PosteriorResult
} from '../model/probabilisticModel';
import {
  Activity,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Snowflake,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Layers
} from 'lucide-react';

interface TransferSyncModuleProps {
  recommendation: TransferRecommendation;
  endometrium: EndometrialCycle;
  setEndometrium: React.Dispatch<React.SetStateAction<EndometrialCycle>>;
  posterior: PosteriorResult;
  currentHpi: number;
}

export const TransferSyncModule: React.FC<TransferSyncModuleProps> = ({
  recommendation,
  endometrium,
  setEndometrium,
  posterior,
  currentHpi
}) => {
  const { blastocystProbability, kidScoreGrade, kidScoreCategory } = posterior.viability;
  const expectedTeb = posterior.kinetics.expectedTeb;
  const syncScore = recommendation.syncQualityScore;

  // Visual status indicators
  const getStatusTheme = () => {
    switch (recommendation.status) {
      case "In-Phase (Harmonized)":
        return {
          bg: "bg-emerald-950/70 border-emerald-500/50 text-emerald-300",
          iconBg: "bg-emerald-500/20 text-emerald-400",
          gauge: "from-emerald-500 to-teal-400",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
        };
      case "Late Phase / Delayed":
        return {
          bg: "bg-amber-950/70 border-amber-500/50 text-amber-300",
          iconBg: "bg-amber-500/20 text-amber-400",
          gauge: "from-amber-500 to-yellow-400",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/40"
        };
      case "Early Transfer Salvage":
        return {
          bg: "bg-blue-950/70 border-blue-500/50 text-blue-300",
          iconBg: "bg-blue-500/20 text-blue-400",
          gauge: "from-blue-500 to-cyan-400",
          badge: "bg-blue-500/20 text-blue-300 border-blue-500/40"
        };
      case "Freeze-All (Vitrification)":
      default:
        return {
          bg: "bg-indigo-950/70 border-indigo-500/50 text-indigo-300",
          iconBg: "bg-indigo-500/20 text-indigo-400",
          gauge: "from-indigo-500 to-purple-400",
          badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
        };
    }
  };

  const theme = getStatusTheme();

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-6 border-2 border-indigo-500/30 shadow-2xl backdrop-blur-md flex flex-col gap-6">
      {/* Module Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 shadow-md">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-100 tracking-tight">
                Endometrial-Embryo Synchronization Engine
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-900/80 text-indigo-300 border border-indigo-600/50">
                End-to-End Module
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Translates morphokinetic trajectory twin predictions into personalized transfer timing & protocol guidance
            </p>
          </div>
        </div>

        {/* Sync Gauge Pill */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Synchrony Alignment</span>
            <span className="text-sm font-mono font-bold text-slate-200">
              Delta: {recommendation.deltaHours > 0 ? `+${recommendation.deltaHours}` : recommendation.deltaHours}h
            </span>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
            <span className="text-xs font-mono font-extrabold text-indigo-400">
              {syncScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Protocol Decision Banner */}
      <div className={`p-5 rounded-2xl border ${theme.bg} shadow-lg transition-all`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-xl ${theme.iconBg} mt-0.5`}>
              {recommendation.status === "In-Phase (Harmonized)" ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : recommendation.status === "Freeze-All (Vitrification)" ? (
                <Snowflake className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
                  {recommendation.status}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  Implantation Potential: {kidScoreGrade} ({Math.round(blastocystProbability * 100)}% Blast Prob)
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white">
                {recommendation.protocol}
              </h3>
              <p className="text-xs text-slate-200/90 mt-1 max-w-2xl leading-relaxed">
                {recommendation.rationale}
              </p>
            </div>
          </div>

          {/* Target Hour Callout */}
          <div className="bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-800 flex flex-col items-center md:items-end min-w-[200px] shrink-0">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              Recommended Transfer Timing
            </span>
            <span className="text-sm font-mono font-bold text-indigo-300 mt-0.5 text-center md:text-right">
              {recommendation.targetTiming}
            </span>
            <span className="text-[10px] text-slate-400 mt-1">
              {recommendation.progesteroneTargetHour > 0
                ? `Target: Progesterone P+${recommendation.progesteroneTargetHour.toFixed(0)}h`
                : 'Cycle Segmentation Protocol'}
            </span>
          </div>
        </div>
      </div>

      {/* Synchrony Visualization Bar: Embryo Arrival vs Window of Implantation */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            Biological Phase Alignment (Day 4.5 &ndash; Day 6.0)
          </span>
          <span className="text-slate-400 text-[11px]">
            Embryo Full Expansion: <strong className="text-indigo-400 font-mono">{expectedTeb.toFixed(1)} hpi</strong> | Endometrial Peak: <strong className="text-emerald-400 font-mono">{endometrium.woiCenterHpi} hpi</strong>
          </span>
        </div>

        {/* Phase Overlap Bar Chart */}
        <div className="relative h-14 bg-slate-900 rounded-lg border border-slate-800 overflow-hidden flex items-center px-4">
          {/* Timeline range 96h to 140h */}
          {/* Uterine Window of Implantation Band */}
          {(() => {
            const minT = 96;
            const maxT = 140;
            const range = maxT - minT;
            const woiStart = Math.max(0, ((endometrium.woiCenterHpi - 12 - minT) / range) * 100);
            const woiWidth = (24 / range) * 100;
            const embPos = Math.max(0, Math.min(100, ((expectedTeb - minT) / range) * 100));

            return (
              <>
                {/* Uterine Receptive Zone */}
                <div
                  className="absolute top-1 bottom-1 bg-emerald-500/20 border-2 border-dashed border-emerald-500/60 rounded-lg flex items-center justify-center"
                  style={{ left: `${woiStart}%`, width: `${woiWidth}%` }}
                >
                  <span className="text-[10px] uppercase font-bold text-emerald-300/80 tracking-wider">
                    Endometrial WOI Window
                  </span>
                </div>

                {/* Embryo Target Dot */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 flex flex-col items-center"
                  style={{ left: `${embPos}%` }}
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-500 border-2 border-white shadow-[0_0_12px_rgba(99,102,241,1)] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <span className="text-[9px] font-mono font-bold text-indigo-300 bg-slate-950 px-1 py-0.2 rounded border border-indigo-700 mt-1 whitespace-nowrap">
                    Embryo: {expectedTeb.toFixed(1)}h
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Endometrial Receptivity Parameter Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Endometrial Thickness */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Endometrial Thickness</span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
              endometrium.thicknessMm >= 7.0
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/50'
                : 'bg-red-950/70 text-red-300 border-red-800/50'
            }`}>
              {endometrium.thicknessMm.toFixed(1)} mm
            </span>
          </div>
          <input
            type="range"
            min={5.0}
            max={14.0}
            step={0.1}
            value={endometrium.thicknessMm}
            onChange={(e) => setEndometrium(prev => ({ ...prev, thicknessMm: Number(e.target.value) }))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <span className="text-[10px] text-slate-400 mt-2">
            Target: &ge; 7.0 mm (Trilaminar). Less than 7mm triggers cycle vitrification.
          </span>
        </div>

        {/* Endometrial Pattern */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-300 mb-2">Echo-Pattern (Ultrasound)</span>
          <div className="grid grid-cols-3 gap-1.5">
            {(["Trilaminar", "Homogeneous", "Hyperechoic"] as const).map(p => (
              <button
                key={p}
                onClick={() => setEndometrium(prev => ({ ...prev, pattern: p }))}
                className={`py-1 text-[11px] font-medium rounded-lg border transition ${
                  endometrium.pattern === p
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 mt-2">
            Trilaminar pattern signifies optimal secretory estrogen/progesterone priming.
          </span>
        </div>

        {/* Window Center Slider */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">WOI Center Benchmark</span>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              P+{endometrium.woiCenterHpi}h
            </span>
          </div>
          <input
            type="range"
            min={105}
            max={135}
            step={1}
            value={endometrium.woiCenterHpi}
            onChange={(e) => setEndometrium(prev => ({ ...prev, woiCenterHpi: Number(e.target.value) }))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <span className="text-[10px] text-slate-400 mt-2">
            ERA/Receptivity peak. Standard Day 5 transfer benchmark is 120 hrs post-progesterone.
          </span>
        </div>
      </div>
    </div>
  );
};
