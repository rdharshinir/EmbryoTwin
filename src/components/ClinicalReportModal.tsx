import React from 'react';
import {
  PatientTwinProfile,
  EmbryoObservations,
  PosteriorResult,
  TransferRecommendation,
  EndometrialCycle
} from '../model/probabilisticModel';
import { FileText, X, Printer, CheckCircle, ShieldCheck, Download } from 'lucide-react';

interface ClinicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PatientTwinProfile;
  observations: EmbryoObservations;
  posterior: PosteriorResult;
  recommendation: TransferRecommendation;
  endometrium: EndometrialCycle;
}

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({
  isOpen,
  onClose,
  profile,
  observations,
  posterior,
  recommendation,
  endometrium
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Digital Embryo Twin & Transfer Synchrony Report
              </h3>
              <p className="text-xs text-slate-400">
                Continuous-Time Bayesian State Model & Endometrial Receptivity Dossier
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Dossier
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-xs text-slate-300">
          {/* Patient Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Maternal Age</span>
              <span className="text-slate-200 font-semibold">{profile.maternalAge} Years</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Incubator Oxygen</span>
              <span className="text-slate-200 font-semibold">{profile.incubatorO2}% (Physiologic)</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">AMH Baseline</span>
              <span className="text-slate-200 font-semibold">{profile.amh} ng/mL</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Elapsed Incubator Time</span>
              <span className="text-indigo-400 font-bold">{observations.currentTimeHpi.toFixed(1)} hpi</span>
            </div>
          </div>

          {/* Morphokinetic Kinetic Parameters */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              1. Morphokinetic Division Metrics (Meseguer Model)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Cell Cycle 2 (cc2 = t3-t2)</span>
                <span className="text-sm font-mono font-bold text-slate-200">{posterior.kinetics.cc2} hrs</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Optimal: 9.3 - 12.6 h</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Synchrony (s2 = t4-t3)</span>
                <span className="text-sm font-mono font-bold text-slate-200">{posterior.kinetics.s2} hrs</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Optimal: &le; 0.75 h</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Expected Blastocyst (tB)</span>
                <span className="text-sm font-mono font-bold text-cyan-400">{posterior.kinetics.expectedTb} hpi</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Mean standard: 112.5 h</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Cellular Fragmentation</span>
                <span className="text-sm font-mono font-bold text-amber-400">{observations.fragmentationPercent}%</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Threshold: &le; 10%</span>
              </div>
            </div>
          </div>

          {/* Viability & Prognosis */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              2. Probabilistic Viability & KIDScore Classification
            </h4>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-semibold text-indigo-400 block">
                  {posterior.viability.kidScoreCategory}
                </span>
                <span className="text-base font-extrabold text-white">
                  KIDScore Grade: {posterior.viability.kidScoreGrade} &bull; Blastocyst Likelihood: {Math.round(posterior.viability.blastocystProbability * 100)}%
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Gardner morphology projection: <strong className="text-slate-200">{posterior.viability.gardnerProjection}</strong>. Estimated euploidy likelihood: <strong className="text-slate-200">{Math.round(posterior.viability.euploidyEstimate * 100)}%</strong>.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-500 block uppercase">Arrest Hazard</span>
                <span className="font-mono text-base font-bold text-red-400">
                  {Math.round(posterior.viability.arrestProbability * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Endometrial Receptivity & Transfer Synchrony Recommendation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              3. Clinical Transfer Timing & Synchronization Prescription
            </h4>
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-700/50 space-y-3">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-indigo-800/40 pb-2.5">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-emerald-400 block">
                    Protocol Decision: {recommendation.status}
                  </span>
                  <span className="text-base font-extrabold text-white">
                    {recommendation.protocol}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Target Transfer Timing</span>
                  <span className="font-mono text-sm font-bold text-indigo-300">
                    {recommendation.targetTiming}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed">
                <strong>Clinical Rationale:</strong> {recommendation.rationale}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-400 border-t border-indigo-800/40">
                <div>Endometrial Thickness: <strong className="text-slate-200">{endometrium.thicknessMm} mm</strong></div>
                <div>Pattern: <strong className="text-slate-200">{endometrium.pattern}</strong></div>
                <div>Phase Synchrony: <strong className="text-slate-200">{recommendation.syncQualityScore}%</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
          <span>Validated against Meseguer / Rubio multi-center morphokinetic datasets</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
