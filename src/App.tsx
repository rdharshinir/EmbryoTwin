import React, { useState, useMemo } from 'react';
import {
  PatientTwinProfile,
  EmbryoObservations,
  EndometrialCycle,
  computeBayesianPosterior,
  recommendTransferSynchrony,
  generateStateTrajectories
} from './model/probabilisticModel';
import { TimelineVisualizer } from './components/TimelineVisualizer';
import { EmbryoAvatar } from './components/EmbryoAvatar';
import { WhatIfSliders } from './components/WhatIfSliders';
import { TransferSyncModule } from './components/TransferSyncModule';
import { StateDistributionChart } from './components/StateDistributionChart';
import { ClinicalReportModal } from './components/ClinicalReportModal';
import {
  Dna,
  Clock,
  Sparkles,
  FileSpreadsheet,
  Activity,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  TrendingUp,
  Cpu
} from 'lucide-react';

const INITIAL_PROFILE: PatientTwinProfile = {
  maternalAge: 32,
  amh: 2.4,
  incubatorO2: 5,
  inseminationType: "ICSI"
};

const INITIAL_OBSERVATIONS: EmbryoObservations = {
  currentTimeHpi: 68.0, // Mid Day-3 benchmark
  t2: 27.2,
  t3: 37.4,
  t4: 38.6,
  t5: 51.6,
  t8: 59.2,
  tM: null,
  tSB: null,
  tB: null,
  fragmentationPercent: 5.0,
  directCleavage: false,
  multinucleation2Cell: false,
  unevenBlastomeres: false
};

const INITIAL_ENDOMETRIUM: EndometrialCycle = {
  progesteroneStartHpi: 0.0,
  thicknessMm: 9.4,
  pattern: "Trilaminar",
  woiCenterHpi: 120.0,
  woiWidthHours: 24.0
};

export const App: React.FC = () => {
  // Model state
  const [profile, setProfile] = useState<PatientTwinProfile>(INITIAL_PROFILE);
  const [observations, setObservations] = useState<EmbryoObservations>(INITIAL_OBSERVATIONS);
  const [endometrium, setEndometrium] = useState<EndometrialCycle>(INITIAL_ENDOMETRIUM);

  // Playhead scrub state
  const [currentHpi, setCurrentHpi] = useState<number>(68.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Modal & Comparison view state
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [showBaselineCompare, setShowBaselineCompare] = useState<boolean>(false);

  // Compute Bayesian posterior in real time (60fps reactive)
  const posterior = useMemo(() => {
    return computeBayesianPosterior(profile, observations);
  }, [profile, observations]);

  // Baseline posterior for comparison
  const baselinePosterior = useMemo(() => {
    return computeBayesianPosterior(INITIAL_PROFILE, INITIAL_OBSERVATIONS);
  }, []);

  // Compute Transfer Synchronization recommendation
  const transferRecommendation = useMemo(() => {
    return recommendTransferSynchrony(posterior, endometrium, currentHpi);
  }, [posterior, endometrium, currentHpi]);

  // Generate continuous-time Markov state trajectories
  const stateTrajectories = useMemo(() => {
    return generateStateTrajectories(posterior, 144, 2);
  }, [posterior]);

  const handleResetBaseline = () => {
    setProfile(INITIAL_PROFILE);
    setObservations(INITIAL_OBSERVATIONS);
    setEndometrium(INITIAL_ENDOMETRIUM);
    setCurrentHpi(68.0);
    setIsPlaying(false);
  };

  const blastProb = posterior.viability.blastocystProbability;
  const isArrested = blastProb < 0.20 && currentHpi > 70;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Dna className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  Embryo Trajectory Twin
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
                  Bayesian State Model
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Continuous-Time Morphokinetic State Estimator & Window-of-Implantation Synchronizer
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowBaselineCompare(!showBaselineCompare)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition shadow-sm ${
                showBaselineCompare
                  ? 'bg-purple-900/40 text-purple-200 border-purple-500/50'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              {showBaselineCompare ? 'Hide Baseline Compare' : 'Compare Baseline Twin'}
            </button>

            <button
              onClick={() => setIsReportOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400 shadow-md shadow-indigo-600/25 border border-indigo-400/30 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Clinical Dossier
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 space-y-6">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Blastocyst Formation Probability */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Blastocyst Viability</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-emerald-400">
                {(blastProb * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                P(Blastocyst)
              </span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${blastProb * 100}%` }}
              />
            </div>
          </div>

          {/* Card 2: KIDScore & Implantation Prognosis */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>KIDScore Implantation Grade</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-amber-300">
                {posterior.viability.kidScoreGrade}
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                {posterior.viability.gardnerProjection}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-2 truncate">
              {posterior.viability.kidScoreCategory}
            </span>
          </div>

          {/* Card 3: Cleavage Kinetics (cc2 & s2) */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Mitotic Kinetics</span>
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">cc2 (t3-t2)</span>
                <span className="text-lg font-bold font-mono text-indigo-300">
                  {posterior.kinetics.cc2}h
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block">s2 (t4-t3)</span>
                <span className="text-lg font-bold font-mono text-cyan-300">
                  {posterior.kinetics.s2}h
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              Expected tB: <strong className="text-slate-200 font-mono">{posterior.kinetics.expectedTb} hpi</strong>
            </span>
          </div>

          {/* Card 4: Endometrial Implantation Synchrony */}
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Endometrial Synchrony</span>
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-purple-300">
                {transferRecommendation.syncQualityScore}%
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Sync Index
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-2 truncate">
              Target: <strong className="text-indigo-300">{transferRecommendation.targetTiming}</strong>
            </span>
          </div>
        </div>

        {/* Baseline Comparison Banner (if enabled) */}
        {showBaselineCompare && (
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                <GitCompare className="w-4 h-4 text-purple-400" />
                Counterfactual Comparison: Baseline Twin vs Current What-If Twin
              </span>
              <span className="text-slate-400">Real-time delta metrics</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-300 pt-1">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Blastocyst Probability</span>
                <span className="font-mono font-bold text-slate-200">
                  Baseline: {(baselinePosterior.viability.blastocystProbability * 100).toFixed(0)}% &rarr;{' '}
                  <span className={blastProb >= baselinePosterior.viability.blastocystProbability ? 'text-emerald-400' : 'text-red-400'}>
                    {(blastProb * 100).toFixed(0)}%
                  </span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Expected Full Blast (tB)</span>
                <span className="font-mono font-bold text-slate-200">
                  Baseline: {baselinePosterior.kinetics.expectedTb}h &rarr;{' '}
                  <span className="text-indigo-300">{posterior.kinetics.expectedTb}h</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">KIDScore Grade</span>
                <span className="font-mono font-bold text-slate-200">
                  Baseline: {baselinePosterior.viability.kidScoreGrade} &rarr;{' '}
                  <span className="text-amber-300">{posterior.viability.kidScoreGrade}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Cell Cycle 2 (cc2)</span>
                <span className="font-mono font-bold text-slate-200">
                  Baseline: {baselinePosterior.kinetics.cc2}h &rarr;{' '}
                  <span className="text-cyan-300">{posterior.kinetics.cc2}h</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Morphokinetic Interactive Timeline Visualizer */}
        <TimelineVisualizer
          currentHpi={currentHpi}
          setCurrentHpi={setCurrentHpi}
          milestones={posterior.milestones}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          woiCenterHpi={endometrium.woiCenterHpi}
          woiWidthHours={endometrium.woiWidthHours}
        />

        {/* Section 2: Split View - Embryo Morphology Avatar & What-If Sliders */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Digital Morphology Avatar */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="w-full">
              <EmbryoAvatar
                currentHpi={currentHpi}
                posteriorKinetics={{
                  t2: posterior.milestones.t2.mean,
                  t3: posterior.milestones.t3.mean,
                  t4: posterior.milestones.t4.mean,
                  t5: posterior.milestones.t5.mean,
                  t8: posterior.milestones.t8.mean,
                  tM: posterior.milestones.tM.mean,
                  tSB: posterior.milestones.tSB.mean,
                  tB: posterior.milestones.tB.mean,
                  tEB: posterior.milestones.tEB.mean
                }}
                fragmentationPercent={observations.fragmentationPercent}
                isArrested={isArrested}
                gardnerGrade={posterior.viability.gardnerProjection.split(' ')[0]}
              />
            </div>
          </div>

          {/* What-If Sliders & Archetype Presets */}
          <div className="lg:col-span-8">
            <WhatIfSliders
              profile={profile}
              setProfile={setProfile}
              observations={observations}
              setObservations={setObservations}
              onReset={handleResetBaseline}
            />
          </div>
        </div>

        {/* Section 3: Continuous-Time State Evolution Curves */}
        <StateDistributionChart
          trajectories={stateTrajectories}
          currentHpi={currentHpi}
          setCurrentHpi={setCurrentHpi}
        />

        {/* Section 4: Clinical Transfer Synchrony Engine (The requested final module) */}
        <TransferSyncModule
          recommendation={transferRecommendation}
          endometrium={endometrium}
          setEndometrium={setEndometrium}
          posterior={posterior}
          currentHpi={currentHpi}
        />
      </main>

      {/* Clinical Dossier Modal */}
      <ClinicalReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        profile={profile}
        observations={observations}
        posterior={posterior}
        recommendation={transferRecommendation}
        endometrium={endometrium}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <span>
            Embryo Trajectory Twin &bull; Probabilistic State Model over Division Timings & Endometrial Synchrony
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Validated for Digital Twin Healthcare Challenge 2026
          </span>
        </div>
      </footer>
    </div>
  );
};
