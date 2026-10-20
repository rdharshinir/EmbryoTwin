/**
 * Probabilistic Embryo Trajectory Model (TypeScript Engine)
 * Implements Continuous-Time Bayesian Conditioning over Division Milestones
 * and Endometrial Receptivity Synchronization.
 */

export interface MilestoneSpec {
  id: string;
  name: string;
  description: string;
  mean: number;
  sd: number;
}

export const CANONICAL_MILESTONES: Record<string, MilestoneSpec> = {
  tPB2: { id: "tPB2", name: "2nd Polar Body", description: "Extrusion of 2nd polar body", mean: 3.8, sd: 1.1 },
  tPN:  { id: "tPN",  name: "2PN Appearance", description: "Appearance of both pronuclei", mean: 8.5, sd: 1.6 },
  tPNf: { id: "tPNf", name: "Syngamy (tPNf)", description: "Pronuclear fading / envelope breakdown", mean: 23.5, sd: 2.8 },
  t2:   { id: "t2",   name: "2-Cell Cleavage", description: "First mitotic cleavage into 2 blastomeres", mean: 27.2, sd: 3.0 },
  t3:   { id: "t3",   name: "3-Cell Cleavage", description: "Cleavage into 3 blastomeres", mean: 37.4, sd: 3.8 },
  t4:   { id: "t4",   name: "4-Cell Cleavage", description: "Division to 4 blastomeres", mean: 39.2, sd: 4.1 },
  t5:   { id: "t5",   name: "5-Cell Cleavage", description: "Division to 5 cells (Cycle 3 start)", mean: 51.6, sd: 5.2 },
  t8:   { id: "t8",   name: "8-Cell Cleavage", description: "Day-3 8-cell stage benchmark", mean: 58.4, sd: 6.4 },
  tM:   { id: "tM",   name: "Morula Compaction", description: "Cell junction tightening / morula", mean: 85.0, sd: 7.5 },
  tSB:  { id: "tSB",  name: "Start Blastulation", description: "Initial cavitation fluid accumulation", mean: 101.5, sd: 8.2 },
  tB:   { id: "tB",   name: "Full Blastocyst", description: "Distinct ICM & trophectoderm expansion", mean: 112.5, sd: 8.8 },
  tEB:  { id: "tEB",  name: "Expanded Blastocyst", description: "Zona pellucida thinning, full expansion", mean: 120.0, sd: 9.4 },
  tHB:  { id: "tHB",  name: "Hatching Blastocyst", description: "Herniation through zona", mean: 132.0, sd: 10.5 },
};

export const MILESTONE_ORDER = ["tPB2", "tPN", "tPNf", "t2", "t3", "t4", "t5", "t8", "tM", "tSB", "tB", "tEB", "tHB"];

export interface PatientTwinProfile {
  maternalAge: number; // 20 - 45
  amh: number;         // ng/mL
  incubatorO2: number; // 5% vs 20%
  inseminationType: "ICSI" | "IVF";
}

export interface EmbryoObservations {
  currentTimeHpi: number;
  t2: number | null;
  t3: number | null;
  t4: number | null;
  t5: number | null;
  t8: number | null;
  tM: number | null;
  tSB: number | null;
  tB: number | null;
  fragmentationPercent: number; // 0 - 40%
  directCleavage: boolean;      // 1 -> 3 cell division
  multinucleation2Cell: boolean;
  unevenBlastomeres: boolean;
}

export interface EndometrialCycle {
  progesteroneStartHpi: number; // Reference time
  thicknessMm: number;          // Target >= 7.5 mm
  pattern: "Trilaminar" | "Homogeneous" | "Hyperechoic";
  woiCenterHpi: number;         // Typical 120.0 hpi
  woiWidthHours: number;        // Typical 24.0 h
}

export interface MilestonePrediction {
  id: string;
  name: string;
  mean: number;
  sd: number;
  ciLower: number;
  ciUpper: number;
  isObserved: boolean;
}

export interface PosteriorResult {
  milestones: Record<string, MilestonePrediction>;
  kinetics: {
    cc2: number; // t3 - t2 (optimal 9-12.5h)
    s2: number;  // t4 - t3 (optimal <= 0.75h)
    cc3: number; // t5 - t3 (optimal 10-14h)
    s3: number;  // t8 - t5
    expectedTb: number;
    expectedTeb: number;
  };
  viability: {
    blastocystProbability: number;
    arrestProbability: number;
    kidScoreCategory: string;
    kidScoreGrade: "A+" | "A" | "B" | "C" | "D";
    euploidyEstimate: number;
    gardnerProjection: string;
  };
}

export interface TransferRecommendation {
  protocol: string;
  status: "In-Phase (Harmonized)" | "Late Phase / Delayed" | "Early Transfer Salvage" | "Freeze-All (Vitrification)" | "Suboptimal Sync";
  synchronyIndex: number;      // 0.0 - 1.0 (overlap between blastocyst arrival & WOI)
  deltaHours: number;          // t_blast - t_woi_peak
  targetTiming: string;        // Specific transfer hour
  rationale: string;
  progesteroneTargetHour: number;
  syncQualityScore: number;    // 0 - 100
}

export interface StateCurvePoint {
  timeHpi: number;
  zygote: number;
  twoCell: number;
  threeCell: number;
  fourCell: number;
  fiveToEightCell: number;
  morula: number;
  earlyBlast: number;
  fullBlast: number;
  expandedBlast: number;
  arrestCleavage: number;
  arrestMorula: number;
  arrestBlast: number;
}

// Matrix helper routines for Gaussian Conditioning
function invertMatrix(M: number[][]): number[][] {
  const n = M.length;
  // Deep clone and augment with identity
  const A: number[][] = M.map((row, i) => [...row, ...Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))]);

  for (let i = 0; i < n; i++) {
    // Pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
    }
    const temp = A[i];
    A[i] = A[maxRow];
    A[maxRow] = temp;

    const pivot = A[i][i];
    if (Math.abs(pivot) < 1e-10) {
      // Small regularization
      A[i][i] += 1e-6;
    }
    const div = A[i][i];
    for (let j = 0; j < 2 * n; j++) A[i][j] /= div;

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = A[k][i];
        for (let j = 0; j < 2 * n; j++) {
          A[k][j] -= factor * A[i][j];
        }
      }
    }
  }

  return A.map(row => row.slice(n));
}

export function computeBayesianPosterior(
  profile: PatientTwinProfile,
  obs: EmbryoObservations
): PosteriorResult {
  const n = MILESTONE_ORDER.length;
  const ageShift = Math.max(0, (profile.maternalAge - 32) * 0.35);
  const o2Shift = profile.incubatorO2 > 10 ? 2.5 : 0;

  // Prior Means and Covariance
  const priorMeans = MILESTONE_ORDER.map((k, i) => {
    const scale = i / (n - 1);
    return CANONICAL_MILESTONES[k].mean + (ageShift + o2Shift) * scale;
  });

  const priorSds = MILESTONE_ORDER.map(k => CANONICAL_MILESTONES[k].sd);

  // Correlation matrix with exponential autoregression
  const priorCov: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const corr = Math.pow(0.88, Math.abs(i - j));
      priorCov[i][j] = priorSds[i] * corr * priorSds[j];
    }
  }

  // Map observations
  const obsMap: Record<string, number | null> = {
    tPB2: null,
    tPN: null,
    tPNf: null,
    t2: obs.t2,
    t3: obs.t3,
    t4: obs.t4,
    t5: obs.t5,
    t8: obs.t8,
    tM: obs.tM,
    tSB: obs.tSB,
    tB: obs.tB,
    tEB: null,
    tHB: null
  };

  const obsIndices: number[] = [];
  const obsValues: number[] = [];
  const unobsIndices: number[] = [];

  MILESTONE_ORDER.forEach((key, idx) => {
    const val = obsMap[key];
    if (val !== null && val <= obs.currentTimeHpi) {
      obsIndices.push(idx);
      obsValues.push(val);
    } else {
      unobsIndices.push(idx);
    }
  });

  const postMeans = [...priorMeans];
  const postVars = priorSds.map(s => s * s);

  if (obsIndices.length > 0 && unobsIndices.length > 0) {
    const kObs = obsIndices.length;
    const kUnobs = unobsIndices.length;

    // Submatrices
    const mu1 = unobsIndices.map(i => priorMeans[i]);
    const mu2 = obsIndices.map(i => priorMeans[i]);

    const cov12: number[][] = Array(kUnobs).fill(0).map((_, r) =>
      Array(kObs).fill(0).map((_, c) => priorCov[unobsIndices[r]][obsIndices[c]])
    );

    const cov22: number[][] = Array(kObs).fill(0).map((_, r) =>
      Array(kObs).fill(0).map((_, c) => {
        const base = priorCov[obsIndices[r]][obsIndices[c]];
        return r === c ? base + 0.15 * 0.15 : base; // Measurement noise
      })
    );

    const cov22Inv = invertMatrix(cov22);

    // Difference (y - mu2)
    const diff = obsValues.map((y, i) => y - mu2[i]);

    // Temp: cov22Inv * diff
    const invDiff = Array(kObs).fill(0).map((_, r) =>
      cov22Inv[r].reduce((sum, val, c) => sum + val * diff[c], 0)
    );

    // Update unobserved means
    unobsIndices.forEach((targetIdx, i) => {
      const delta = cov12[i].reduce((sum, val, c) => sum + val * invDiff[c], 0);
      postMeans[targetIdx] = mu1[i] + delta;
    });

    // Update observed indices with exact measured values
    obsIndices.forEach((targetIdx, i) => {
      postMeans[targetIdx] = obsValues[i];
      postVars[targetIdx] = 0;
    });

    // Posterior variance approximation
    unobsIndices.forEach((targetIdx, i) => {
      const origVar = priorCov[targetIdx][targetIdx];
      // Reduction factor based on correlation
      const reduction = cov12[i].reduce((sum, val, c) => {
        const rowContr = cov22Inv[c].reduce((subSum, invV, k) => subSum + invV * cov12[i][k], 0);
        return sum + val * rowContr;
      }, 0);
      postVars[targetIdx] = Math.max(0.2, origVar - reduction);
    });
  } else if (obsIndices.length > 0) {
    obsIndices.forEach((targetIdx, i) => {
      postMeans[targetIdx] = obsValues[i];
      postVars[targetIdx] = 0;
    });
  }

  // Morphokinetic parameters
  const getMean = (k: string) => postMeans[MILESTONE_ORDER.indexOf(k)];
  const t2Val = getMean("t2");
  const t3Val = getMean("t3");
  const t4Val = getMean("t4");
  const t5Val = getMean("t5");
  const t8Val = getMean("t8");
  const tBVal = getMean("tB");
  const tEBVal = getMean("tEB");

  const cc2 = Math.max(0.1, t3Val - t2Val);
  const s2 = Math.max(0.0, t4Val - t3Val);
  const cc3 = Math.max(0.1, t5Val - t3Val);
  const s3 = Math.max(0.0, t8Val - t5Val);

  // Viability & KIDScore Calculation
  let logOdds = 1.7; // Base ~84% blastocyst formation rate

  // Morphokinetic criteria penalties (Meseguer et al. 2011)
  if (cc2 < 5.0) logOdds -= 2.5; // Direct cleavage or abnormal mitosis
  else if (cc2 >= 9.0 && cc2 <= 12.5) logOdds += 0.8; // Optimal cc2
  else if (cc2 > 14.0) logOdds -= 1.3;

  if (s2 <= 0.75) logOdds += 0.6; // Synchronous cleavage
  else if (s2 > 2.5) logOdds -= 1.1;

  if (obs.fragmentationPercent > 15.0) {
    logOdds -= (obs.fragmentationPercent - 15.0) * 0.08;
  }
  if (obs.directCleavage) logOdds -= 2.6;
  if (obs.multinucleation2Cell) logOdds -= 1.2;
  if (obs.unevenBlastomeres) logOdds -= 0.75;

  if (profile.maternalAge > 35) {
    logOdds -= (profile.maternalAge - 35) * 0.09;
  }
  if (profile.incubatorO2 > 10) {
    logOdds -= 0.45;
  }

  const blastProb = Math.min(0.97, Math.max(0.04, 1.0 / (1.0 + Math.exp(-logOdds))));
  const arrestProb = 1.0 - blastProb;

  // Grade categorization
  let kidGrade: "A+" | "A" | "B" | "C" | "D" = "B";
  let kidScoreCategory = "Category 2 (Good Prognosis)";
  let gardnerProjection = "3BB / 4BA (Average to Good)";

  if (blastProb >= 0.85 && s2 <= 0.8 && cc2 >= 9.0 && cc2 <= 12.5 && !obs.directCleavage) {
    kidGrade = "A+";
    kidScoreCategory = "Category 1 (Top Tier - High Implantation Potential)";
    gardnerProjection = "4AA / 5AA (Excellent ICM & TE Expansion)";
  } else if (blastProb >= 0.70) {
    kidGrade = "A";
    kidScoreCategory = "Category 2 (Above Average Morphokinetics)";
    gardnerProjection = "4AB / 4BA (Robust Expansion)";
  } else if (blastProb >= 0.45) {
    kidGrade = "B";
    kidScoreCategory = "Category 3 (Moderate - Slower Mitotic Cadence)";
    gardnerProjection = "3BB / 3BC (Fair Expansion)";
  } else if (blastProb >= 0.22) {
    kidGrade = "C";
    kidScoreCategory = "Category 4 (Suboptimal / Dyssynchronous Cleavage)";
    gardnerProjection = "2BC / Early Cavitation";
  } else {
    kidGrade = "D";
    kidScoreCategory = "Category 5 (Critical Arrest Hazard)";
    gardnerProjection = "Compacted Morula / Cleavage Arrest";
  }

  // Euploidy projection
  const age = profile.maternalAge;
  let baseEuploid = 0.65;
  if (age < 30) baseEuploid = 0.72;
  else if (age < 35) baseEuploid = 0.60;
  else if (age < 38) baseEuploid = 0.46;
  else if (age < 41) baseEuploid = 0.32;
  else baseEuploid = 0.16;

  const euploidyEstimate = Math.min(0.92, Math.max(0.06, baseEuploid + (blastProb - 0.5) * 0.22 - (obs.fragmentationPercent * 0.004)));

  const milestones: Record<string, MilestonePrediction> = {};
  MILESTONE_ORDER.forEach((key, idx) => {
    const mean = postMeans[idx];
    const sd = Math.sqrt(postVars[idx]);
    milestones[key] = {
      id: key,
      name: CANONICAL_MILESTONES[key].name,
      mean: Math.round(mean * 10) / 10,
      sd: Math.round(sd * 10) / 10,
      ciLower: Math.max(0, Math.round((mean - 1.96 * sd) * 10) / 10),
      ciUpper: Math.round((mean + 1.96 * sd) * 10) / 10,
      isObserved: obsIndices.includes(idx)
    };
  });

  return {
    milestones,
    kinetics: {
      cc2: Math.round(cc2 * 10) / 10,
      s2: Math.round(s2 * 10) / 10,
      cc3: Math.round(cc3 * 10) / 10,
      s3: Math.round(s3 * 10) / 10,
      expectedTb: Math.round(tBVal * 10) / 10,
      expectedTeb: Math.round(tEBVal * 10) / 10
    },
    viability: {
      blastocystProbability: Math.round(blastProb * 1000) / 1000,
      arrestProbability: Math.round(arrestProb * 1000) / 1000,
      kidScoreCategory,
      kidScoreGrade: kidGrade,
      euploidyEstimate: Math.round(euploidyEstimate * 1000) / 1000,
      gardnerProjection
    }
  };
}

export function recommendTransferSynchrony(
  posterior: PosteriorResult,
  endometrium: EndometrialCycle,
  currentHpi: number
): TransferRecommendation {
  const blastProb = posterior.viability.blastocystProbability;
  const expectedTeb = posterior.kinetics.expectedTeb; // Target expanded blastocyst
  const endoPeak = endometrium.woiCenterHpi;

  const deltaHours = Math.round((expectedTeb - endoPeak) * 10) / 10;
  const sigma = endometrium.woiWidthHours / 3.0;
  const syncIndex = Math.round(Math.exp(-0.5 * Math.pow(deltaHours / sigma, 2)) * 1000) / 1000;
  const syncScore = Math.round(syncIndex * 100);

  // Uterine lining threshold
  if (endometrium.thicknessMm < 7.0) {
    return {
      protocol: "Elective Freeze-All (Cryopreservation)",
      status: "Freeze-All (Vitrification)",
      synchronyIndex: syncIndex,
      deltaHours,
      targetTiming: "Next Menstrual Cycle (Programmed FET)",
      rationale: `Endometrial thickness (${endometrium.thicknessMm} mm) is below the clinical threshold (≥7.0 mm). High risk of implantation failure. Cryopreserve blastocyst on Day 5/6 for optimized frozen transfer.`,
      progesteroneTargetHour: 0,
      syncQualityScore: 20
    };
  }

  // Harmonized Day-5 Fresh Transfer
  if (Math.abs(deltaHours) <= 7.0 && blastProb >= 0.55) {
    const targetHpi = Math.round(expectedTeb);
    return {
      protocol: "Fresh Day-5 Blastocyst Transfer",
      status: "In-Phase (Harmonized)",
      synchronyIndex: syncIndex,
      deltaHours,
      targetTiming: `Day 5 @ ${targetHpi} hpi (±3 hrs)`,
      rationale: `Perfect temporal alignment between expanded blastocyst stage (${targetHpi}h) and receptive endometrium peak (${endoPeak}h). High implantation probability (${syncScore}% synchrony).`,
      progesteroneTargetHour: targetHpi - endometrium.progesteroneStartHpi,
      syncQualityScore: syncScore
    };
  }

  // Delayed Blastulation -> Day-6 Transfer
  if (deltaHours > 7.0 && deltaHours <= 20.0 && blastProb >= 0.40) {
    const targetHpi = Math.round(expectedTeb);
    return {
      protocol: "Extended Culture to Day-6 Transfer",
      status: "Late Phase / Delayed",
      synchronyIndex: syncIndex,
      deltaHours,
      targetTiming: `Day 6 @ ${targetHpi} hpi`,
      rationale: `Embryo mitotic kinetics are slightly slower than mean (delta +${deltaHours}h). Allow 24h extended culture. If endometrial receptivity remains receptive, proceed with Day-6 transfer; otherwise freeze.`,
      progesteroneTargetHour: targetHpi - endometrium.progesteroneStartHpi,
      syncQualityScore: syncScore
    };
  }

  // Low in vitro viability early on -> Salvage Day-3 Transfer
  if (blastProb < 0.35 && currentHpi <= 72.0) {
    return {
      protocol: "Immediate Day-3 Cleavage Transfer (Salvage)",
      status: "Early Transfer Salvage",
      synchronyIndex: 0.45,
      deltaHours: -48.0,
      targetTiming: "Day 3 @ 68 - 72 hpi",
      rationale: `Probabilistic twin flags high risk of in vitro blastocyst arrest (${Math.round(posterior.viability.arrestProbability * 100)}%). Immediate in vivo uterine transfer leverages physiological microenvironment.`,
      progesteroneTargetHour: 70.0,
      syncQualityScore: 45
    };
  }

  // Significant Dyssynchrony -> Freeze-All
  return {
    protocol: "Elective Freeze-All & Segmented FET",
    status: "Freeze-All (Vitrification)",
    synchronyIndex: syncIndex,
    deltaHours,
    targetTiming: "Vitrify at Full Expansion (Day 5/6) -> Subsequent Cycle",
    rationale: `Asynchrony of ${deltaHours > 0 ? '+' : ''}${deltaHours}h exceeds the optimal receptive window. Fresh transfer carries elevated failure risk. Vitrifying protects high-grade blastocyst for cycle alignment.`,
    progesteroneTargetHour: 0,
    syncQualityScore: Math.max(15, syncScore)
  };
}

export function generateStateTrajectories(
  posterior: PosteriorResult,
  maxHpi: number = 144,
  stepHpi: number = 2
): StateCurvePoint[] {
  const points: StateCurvePoint[] = [];
  const milestones = posterior.milestones;
  const blastProb = posterior.viability.blastocystProbability;
  const arrestProb = posterior.viability.arrestProbability;

  const t2 = milestones.t2.mean;
  const t3 = milestones.t3.mean;
  const t4 = milestones.t4.mean;
  const t5 = milestones.t5.mean;
  const tM = milestones.tM.mean;
  const tSB = milestones.tSB.mean;
  const tB = milestones.tB.mean;
  const tEB = milestones.tEB.mean;

  for (let t = 0; t <= maxHpi; t += stepHpi) {
    const pArrCleav = arrestProb * 0.45 * (1.0 / (1.0 + Math.exp(-(t - 44.0) / 8.0)));
    const pArrMor = arrestProb * 0.35 * (1.0 / (1.0 + Math.exp(-(t - 78.0) / 9.0)));
    const pArrBlast = arrestProb * 0.20 * (1.0 / (1.0 + Math.exp(-(t - 108.0) / 8.0)));
    const totArrest = pArrCleav + pArrMor + pArrBlast;
    const pViable = Math.max(0.02, 1.0 - totArrest);

    // State weighting
    const w0 = t < t2 ? Math.exp(-Math.pow((t - 10) / 11, 2)) : 0;
    const w1 = Math.exp(-Math.pow((t - (t2 + t3) / 2) / Math.max(2, (t3 - t2) / 1.7), 2));
    const w2 = Math.exp(-Math.pow((t - (t3 + t4) / 2) / Math.max(1.8, (t4 - t3) / 1.7), 2));
    const w3 = Math.exp(-Math.pow((t - (t4 + t5) / 2) / Math.max(2.4, (t5 - t4) / 1.7), 2));
    const w4 = Math.exp(-Math.pow((t - (t5 + tM) / 2) / Math.max(6.0, (tM - t5) / 1.8), 2));
    const w5 = Math.exp(-Math.pow((t - (tM + tSB) / 2) / Math.max(4.0, (tSB - tM) / 1.8), 2));
    const w6 = Math.exp(-Math.pow((t - (tSB + tB) / 2) / Math.max(4.0, (tB - tSB) / 1.8), 2));
    const w7 = Math.exp(-Math.pow((t - (tB + tEB) / 2) / Math.max(4.0, (tEB - tB) / 1.8), 2));
    const w8 = 1.0 / (1.0 + Math.exp(-(t - tEB) / 4.0));

    const sumW = w0 + w1 + w2 + w3 + w4 + w5 + w6 + w7 + w8 + 1e-6;
    const factor = pViable / sumW;

    points.push({
      timeHpi: t,
      zygote: Math.round((w0 * factor) * 1000) / 1000,
      twoCell: Math.round((w1 * factor) * 1000) / 1000,
      threeCell: Math.round((w2 * factor) * 1000) / 1000,
      fourCell: Math.round((w3 * factor) * 1000) / 1000,
      fiveToEightCell: Math.round((w4 * factor) * 1000) / 1000,
      morula: Math.round((w5 * factor) * 1000) / 1000,
      earlyBlast: Math.round((w6 * factor) * 1000) / 1000,
      fullBlast: Math.round((w7 * factor) * 1000) / 1000,
      expandedBlast: Math.round((w8 * factor) * 1000) / 1000,
      arrestCleavage: Math.round(pArrCleav * 1000) / 1000,
      arrestMorula: Math.round(pArrMor * 1000) / 1000,
      arrestBlast: Math.round(pArrBlast * 1000) / 1000,
    });
  }

  return points;
}
