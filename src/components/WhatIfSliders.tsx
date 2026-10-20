import React from 'react';
import { Sliders, Sparkles, RefreshCw, AlertTriangle, ShieldCheck, Thermometer } from 'lucide-react';
import { PatientTwinProfile, EmbryoObservations } from '../model/probabilisticModel';

interface WhatIfSlidersProps {
  profile: PatientTwinProfile;
  setProfile: React.Dispatch<React.SetStateAction<PatientTwinProfile>>;
  observations: EmbryoObservations;
  setObservations: React.Dispatch<React.SetStateAction<EmbryoObservations>>;
  onReset: () => void;
}

export const WhatIfSliders: React.FC<WhatIfSlidersProps> = ({
  profile,
  setProfile,
  observations,
  setObservations,
  onReset
}) => {
  // Preset scenarios
  const applyPreset = (type: string) => {
    if (type === "optimal") {
      setProfile({
        maternalAge: 30,
        amh: 2.8,
        incubatorO2: 5,
        inseminationType: "ICSI"
      });
      setObservations(prev => ({
        ...prev,
        t2: 26.8,
        t3: 36.8,
        t4: 37.4,
        t5: 50.8,
        t8: 57.5,
        fragmentationPercent: 3,
        directCleavage: false,
        multinucleation2Cell: false,
        unevenBlastomeres: false
      }));
    } else if (type === "delayed_age") {
      setProfile({
        maternalAge: 40,
        amh: 1.1,
        incubatorO2: 5,
        inseminationType: "ICSI"
      });
      setObservations(prev => ({
        ...prev,
        t2: 31.5,
        t3: 44.0,
        t4: 45.2,
        t5: 58.0,
        t8: 68.0,
        fragmentationPercent: 12,
        directCleavage: false,
        multinucleation2Cell: false,
        unevenBlastomeres: true
      }));
    } else if (type === "direct_cleavage") {
      setObservations(prev => ({
        ...prev,
        t2: 24.0,
        t3: 25.5, // t3 - t2 < 2h (Direct 1 -> 3 cleavage skip)
        t4: 36.0,
        fragmentationPercent: 18,
        directCleavage: true,
        multinucleation2Cell: true
      }));
    } else if (type === "dyssynchronous") {
      setObservations(prev => ({
        ...prev,
        t2: 28.0,
        t3: 36.0,
        t4: 40.2, // s2 = 4.2h (severely dyssynchronous)
        fragmentationPercent: 14,
        directCleavage: false,
        unevenBlastomeres: true
      }));
    } else if (type === "oxidative_stress") {
      setProfile(prev => ({ ...prev, incubatorO2: 20 }));
      setObservations(prev => ({
        ...prev,
        fragmentationPercent: 16
      }));
    }
  };

  // Derived kinetics for slider feedback
  const t2 = observations.t2 || 27.2;
  const t3 = observations.t3 || 37.4;
  const t4 = observations.t4 || 39.2;
  const cc2 = Math.round((t3 - t2) * 10) / 10;
  const s2 = Math.round((t4 - t3) * 10) / 10;

  return (
    <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl backdrop-blur-md flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              What-If Counterfactual Sliders
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-700/50">
                Probabilistic Twin Perturbations
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Perturb division timings, maternal age & morphokinetics to observe real-time trajectory shifts
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Baseline
        </button>
      </div>

      {/* Preset Scenarios Pill Bar */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Clinical Archetype Presets
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyPreset("optimal")}
            className="px-2.5 py-1 text-xs rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-900/50 transition flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Top-Tier Euploid
          </button>
          <button
            onClick={() => applyPreset("delayed_age")}
            className="px-2.5 py-1 text-xs rounded-lg bg-amber-950/60 text-amber-300 border border-amber-700/50 hover:bg-amber-900/50 transition flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Advanced Age Delayed Cleaver
          </button>
          <button
            onClick={() => applyPreset("direct_cleavage")}
            className="px-2.5 py-1 text-xs rounded-lg bg-red-950/60 text-red-300 border border-red-700/50 hover:bg-red-900/50 transition flex items-center gap-1.5"
          >
            Direct Cleavage (1 &rarr; 3 skip)
          </button>
          <button
            onClick={() => applyPreset("dyssynchronous")}
            className="px-2.5 py-1 text-xs rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-700/50 hover:bg-indigo-900/50 transition flex items-center gap-1.5"
          >
            Prolonged s2 Dyssynchrony
          </button>
          <button
            onClick={() => applyPreset("oxidative_stress")}
            className="px-2.5 py-1 text-xs rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-700/50 hover:bg-cyan-900/50 transition flex items-center gap-1.5"
          >
            <Thermometer className="w-3.5 h-3.5" />
            Atmospheric (20% O₂) Stress
          </button>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Maternal Age */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Maternal Age</span>
            <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
              {profile.maternalAge} yrs
            </span>
          </div>
          <input
            type="range"
            min={21}
            max={45}
            step={1}
            value={profile.maternalAge}
            onChange={(e) => setProfile(p => ({ ...p, maternalAge: Number(e.target.value) }))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <span className="text-[10px] text-slate-400 mt-2">
            Impacts baseline mitotic cadence and prior euploidy risk.
          </span>
        </div>

        {/* First Cleavage t2 */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">First Cleavage (t2)</span>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              {observations.t2?.toFixed(1) || "27.2"} hpi
            </span>
          </div>
          <input
            type="range"
            min={20}
            max={38}
            step={0.2}
            value={observations.t2 || 27.2}
            onChange={(e) => {
              const val = Number(e.target.value);
              setObservations(o => ({
                ...o,
                t2: val,
                // keep t3 sequential
                t3: Math.max(val + 3.0, o.t3 || val + 10.0)
              }));
            }}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <span className="text-[10px] text-slate-400 mt-2">
            Optimal: 24.3 - 27.9 hpi. Early cleavage correlates with blastocyst yield.
          </span>
        </div>

        {/* Cell Cycle cc2 (t3 - t2) */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-300">Cell Cycle 2 (cc2)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                cc2 >= 9.0 && cc2 <= 12.5 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {cc2 >= 9.0 && cc2 <= 12.5 ? 'Optimal' : 'Suboptimal'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
              {cc2.toFixed(1)} h
            </span>
          </div>
          <input
            type="range"
            min={3}
            max={18}
            step={0.2}
            value={cc2}
            onChange={(e) => {
              const newCc2 = Number(e.target.value);
              const curT2 = observations.t2 || 27.2;
              setObservations(o => ({
                ...o,
                t3: Math.round((curT2 + newCc2) * 10) / 10,
                t4: Math.round((curT2 + newCc2 + 1.2) * 10) / 10
              }));
            }}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-[10px] text-slate-400 mt-2">
            Optimal: 9.3 - 12.6 hrs. Values &lt;5h trigger direct cleavage alert.
          </span>
        </div>

        {/* Division Synchrony s2 (t4 - t3) */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-300">Cleavage Synchrony (s2)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                s2 <= 0.75 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
              }`}>
                {s2 <= 0.75 ? 'Synchronous' : 'Dyssynchronous'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
              {s2.toFixed(1)} h
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={s2}
            onChange={(e) => {
              const newS2 = Number(e.target.value);
              const curT3 = observations.t3 || 37.4;
              setObservations(o => ({
                ...o,
                t4: Math.round((curT3 + newS2) * 10) / 10
              }));
            }}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-[10px] text-slate-400 mt-2">
            Optimal: &le;0.75 hrs. Long s2 flags blastomere asynchronous division.
          </span>
        </div>

        {/* Fragmentation Percentage */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Cellular Fragmentation</span>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
              {observations.fragmentationPercent}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={35}
            step={1}
            value={observations.fragmentationPercent}
            onChange={(e) => setObservations(o => ({ ...o, fragmentationPercent: Number(e.target.value) }))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <span className="text-[10px] text-slate-400 mt-2">
            Perivitelline fragments. &gt;15% significantly increases blastocyst arrest hazard.
          </span>
        </div>

        {/* Incubator Gas & Toggles */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Incubator Oxygen</span>
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => setProfile(p => ({ ...p, incubatorO2: 5 }))}
                className={`px-2 py-0.5 rounded ${profile.incubatorO2 === 5 ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'}`}
              >
                5% (Physio)
              </button>
              <button
                onClick={() => setProfile(p => ({ ...p, incubatorO2: 20 }))}
                className={`px-2 py-0.5 rounded ${profile.incubatorO2 === 20 ? 'bg-amber-600 text-white font-medium' : 'text-slate-400'}`}
              >
                20% (Atmos)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
            <label className="text-xs text-slate-300 cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={observations.directCleavage}
                onChange={(e) => setObservations(o => ({ ...o, directCleavage: e.target.checked }))}
                className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0 cursor-pointer"
              />
              Direct 1 &rarr; 3 Cleavage
            </label>
            <label className="text-xs text-slate-300 cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={observations.multinucleation2Cell}
                onChange={(e) => setObservations(o => ({ ...o, multinucleation2Cell: e.target.checked }))}
                className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0 cursor-pointer"
              />
              2-Cell Multinucleation
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
