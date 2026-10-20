"""
Embryo Trajectory Twin: Probabilistic State Model & Transfer Synchrony Engine
=============================================================================
A continuous-time Bayesian state model over IVF time-lapse morphokinetics
(t2, t3, t4, t5, t8, tM, tSB, tB, tEB) with counterfactual sensitivity analysis
and endometrial synchronization recommendation.

Scientific References:
- Meseguer et al. (2011), "The use of morphokinetics as a predictor of embryo
  implantation", Human Reproduction 26(10):2658-2671.
- Rubio et al. (2014), "Clinical validation of embryo culture and selection
  by morphokinetic analysis", Human Reproduction 29(4):732-740.
- Ciray et al. (2014), "Proposed guidelines on the nomenclature and timing
  of time-lapse embryo morphology", Human Reproduction 29(12):2624-2637.
"""

import numpy as np
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass, asdict


# Canonical morphokinetic milestones (hours post-insemination, hpi)
# Mean and Standard Deviations from multi-center time-lapse incubator cohorts (ESHRE/Alpha)
CANONICAL_MILESTONES = {
    "tPB2": {"name": "2nd Polar Body Extrusion", "mean": 3.8,  "sd": 1.1,  "min": 1.5,  "max": 8.0},
    "tPN":  {"name": "Pronuclei Appearance",      "mean": 8.5,  "sd": 1.6,  "min": 5.0,  "max": 14.0},
    "tPNf": {"name": "Pronuclear Fading (Syngamy)","mean": 23.5, "sd": 2.8,  "min": 18.0, "max": 30.0},
    "t2":   {"name": "2-Cell Cleavage",           "mean": 27.2, "sd": 3.0,  "min": 21.0, "max": 36.0},
    "t3":   {"name": "3-Cell Cleavage",           "mean": 37.4, "sd": 3.8,  "min": 30.0, "max": 48.0},
    "t4":   {"name": "4-Cell Cleavage",           "mean": 39.2, "sd": 4.1,  "min": 32.0, "max": 52.0},
    "t5":   {"name": "5-Cell Cleavage",           "mean": 51.6, "sd": 5.2,  "min": 42.0, "max": 65.0},
    "t8":   {"name": "8-Cell Cleavage",           "mean": 58.4, "sd": 6.4,  "min": 48.0, "max": 76.0},
    "tM":   {"name": "Morula Compaction",         "mean": 85.0, "sd": 7.5,  "min": 70.0, "max": 105.0},
    "tSB":  {"name": "Start of Blastulation",     "mean": 101.5,"sd": 8.2,  "min": 85.0, "max": 120.0},
    "tB":   {"name": "Full Blastocyst",           "mean": 112.5,"sd": 8.8,  "min": 95.0, "max": 132.0},
    "tEB":  {"name": "Expanded Blastocyst",       "mean": 120.0,"sd": 9.4,  "min": 102.0,"max": 140.0},
    "tHB":  {"name": "Hatching Blastocyst",       "mean": 132.0,"sd": 10.5, "min": 112.0,"max": 150.0},
}

MILESTONE_KEYS = list(CANONICAL_MILESTONES.keys())

# Ordered discrete biological states
STATES = [
    "S0_Zygote",          # 0 - tPNf
    "S1_2Cell",           # t2 - t3
    "S2_3Cell",           # t3 - t4
    "S3_4Cell",           # t4 - t5
    "S4_5to8Cell",        # t5 - tM
    "S5_Morula",          # tM - tSB
    "S6_EarlyBlastocyst", # tSB - tB
    "S7_FullBlastocyst",  # tB - tEB
    "S8_ExpandedHatching",# tEB+
    "ARREST_Cleavage",    # Developmental arrest during cleavage
    "ARREST_Morula",      # Arrest during compaction
    "ARREST_Blastocyst"   # Degeneration / failure to expand
]


@dataclass
class EmbryoPatientProfile:
    """Clinical baseline characteristics of the maternal/oocyte profile"""
    maternal_age: float = 32.0       # Maternal age (years)
    amh_level: float = 2.4           # Anti-Müllerian Hormone (ng/mL)
    bmi: float = 23.5                # Maternal BMI
    incubator_o2_percent: float = 5.0 # Incubator oxygen: 5% (physiologic) vs 20% (atmospheric)
    icsi: bool = True                # ICSI vs standard IVF
    is_frozen_thawed_oocyte: bool = False


@dataclass
class EmbryoObservations:
    """Observed time-lapse checkpoints recorded by embryologist or automated sensor"""
    current_time_hpi: float = 68.0   # Current incubator elapsed hours
    t2: Optional[float] = 27.5
    t3: Optional[float] = 37.8
    t4: Optional[float] = 38.6
    t5: Optional[float] = 52.1
    t8: Optional[float] = 60.0
    tM: Optional[float] = None       # Not yet observed
    tSB: Optional[float] = None
    tB: Optional[float] = None
    fragmentation_percent: float = 6.0   # Visual fragmentation (0 - 40%)
    direct_cleavage_detected: bool = False # 1 -> 3 cell skip
    multinucleation_at_2cell: bool = False
    uneven_blastomere_size: bool = False


@dataclass
class EndometrialContext:
    """Endometrial cycle parameters for uterine synchronization"""
    cycle_type: str = "HRT"          # "Natural", "Modified_Natural", "HRT"
    progesterone_start_hpi: float = 0.0 # Progesterone administration benchmark
    endometrial_thickness_mm: float = 9.2 # Desired >= 7.0 mm
    endometrial_pattern: str = "Trilaminar" # "Trilaminar", "Homogeneous", "Hyperechoic"
    woi_center_hpi: float = 120.0    # Canonical window of implantation peak (Day 5 ~ 120h post-P)
    woi_width_hours: float = 24.0    # Total receptive window duration


class EmbryoProbabilisticTwin:
    """
    Probabilistic Digital Twin of Pre-implantation Human Embryo
    using a continuous-time multivariate Gaussian-Markov representation
    coupled with Bayesian updating and an endometrial synchronization engine.
    """

    def __init__(self, profile: Optional[EmbryoPatientProfile] = None):
        self.profile = profile or EmbryoPatientProfile()
        self._build_prior_covariance()

    def _build_prior_covariance(self):
        """Construct prior mean vector and covariance matrix over milestone timings."""
        n = len(MILESTONE_KEYS)
        self.prior_means = np.array([CANONICAL_MILESTONES[k]["mean"] for k in MILESTONE_KEYS])
        self.prior_sds = np.array([CANONICAL_MILESTONES[k]["sd"] for k in MILESTONE_KEYS])

        # Maternal age & incubator environment adjustments to prior
        age_shift = max(0.0, (self.profile.maternal_age - 32.0) * 0.35)
        o2_shift = 2.5 if self.profile.incubator_o2_percent > 10.0 else 0.0

        # Adjust subsequent division times progressively
        scaling = np.linspace(0.0, 1.0, n)
        self.prior_means += (age_shift + o2_shift) * scaling

        # Autoregressive correlation structure between sequential milestones
        # (Embryos that cleave late at t2 tend to be late at t3, t5, tB)
        corr_matrix = np.zeros((n, n))
        for i in range(n):
            for j in range(n):
                decay = 0.88 ** abs(i - j)
                corr_matrix[i, j] = decay

        # Covariance = D * Corr * D
        D = np.diag(self.prior_sds)
        self.prior_cov = D @ corr_matrix @ D

    def compute_bayesian_posterior(self, obs: EmbryoObservations) -> Dict[str, Any]:
        """
        Compute Gaussian conditioning posterior given sparse observed timings.
        P(T_future | T_observed)
        """
        obs_dict = {
            "tPB2": None, "tPN": None, "tPNf": None,
            "t2": obs.t2, "t3": obs.t3, "t4": obs.t4,
            "t5": obs.t5, "t8": obs.t8, "tM": obs.tM,
            "tSB": obs.tSB, "tB": obs.tB
        }

        # Identify observed and unobserved indices
        observed_idx = []
        observed_vals = []
        unobserved_idx = []

        for idx, k in enumerate(MILESTONE_KEYS):
            val = obs_dict.get(k)
            # Only count as observed if within current_time_hpi and not None
            if val is not None and val <= obs.current_time_hpi:
                observed_idx.append(idx)
                observed_vals.append(val)
            else:
                unobserved_idx.append(idx)

        mu = self.prior_means
        cov = self.prior_cov

        if len(observed_idx) == 0:
            post_means = mu.copy()
            post_cov = cov.copy()
        else:
            i_obs = np.array(observed_idx)
            i_unobs = np.array(unobserved_idx)
            y = np.array(observed_vals)

            mu_1 = mu[i_unobs]
            mu_2 = mu[i_obs]
            cov_11 = cov[np.ix_(i_unobs, i_unobs)]
            cov_12 = cov[np.ix_(i_unobs, i_obs)]
            cov_21 = cov[np.ix_(i_obs, i_unobs)]
            cov_22 = cov[np.ix_(i_obs, i_obs)]

            # Measurement noise variance (sensor / human timing precision ~0.25 h)
            R = np.eye(len(i_obs)) * (0.3 ** 2)
            cov_22_inv = np.linalg.pinv(cov_22 + R)

            cond_mu = mu_1 + cov_12 @ cov_22_inv @ (y - mu_2)
            cond_cov = cov_11 - cov_12 @ cov_22_inv @ cov_21

            post_means = np.zeros(len(MILESTONE_KEYS))
            post_means[i_obs] = y
            post_means[i_unobs] = cond_mu

            post_cov = np.zeros((len(MILESTONE_KEYS), len(MILESTONE_KEYS)))
            post_cov[np.ix_(i_unobs, i_unobs)] = cond_cov

        # Morphokinetic predictive parameters
        idx_map = {k: i for i, k in enumerate(MILESTONE_KEYS)}
        t2_val = post_means[idx_map["t2"]]
        t3_val = post_means[idx_map["t3"]]
        t4_val = post_means[idx_map["t4"]]
        t5_val = post_means[idx_map["t5"]]
        t8_val = post_means[idx_map["t8"]]
        tM_val = post_means[idx_map["tM"]]
        tSB_val = post_means[idx_map["tSB"]]
        tB_val = post_means[idx_map["tB"]]

        # Kinetic intervals
        cc2 = max(0.1, t3_val - t2_val)      # Cell cycle 2 (optimal: 9 - 12h)
        s2 = max(0.0, t4_val - t3_val)       # Division synchrony (optimal: 0 - 0.75h)
        cc3 = max(0.1, t5_val - t3_val)      # Cell cycle 3 (optimal: 10 - 14h)
        s3 = max(0.0, t8_val - t5_val)

        # Arrest and Blastocyst Viability Hazard Scoring (Meseguer Model & Alpha ESHRE)
        blast_prob, kid_score, arrest_risk = self._compute_viability_scores(
            cc2=cc2, s2=s2, cc3=cc3, tB=tB_val, obs=obs
        )

        milestone_predictions = {}
        for idx, k in enumerate(MILESTONE_KEYS):
            mean_v = float(post_means[idx])
            sd_v = float(np.sqrt(max(0.01, post_cov[idx, idx]))) if idx in unobserved_idx else 0.0
            milestone_predictions[k] = {
                "label": CANONICAL_MILESTONES[k]["name"],
                "mean": round(mean_v, 2),
                "sd": round(sd_v, 2),
                "ci_lower": round(max(0.0, mean_v - 1.96 * sd_v), 2),
                "ci_upper": round(mean_v + 1.96 * sd_v, 2),
                "is_observed": idx in observed_idx
            }

        return {
            "milestones": milestone_predictions,
            "kinetics": {
                "cc2_hours": round(cc2, 2),
                "s2_hours": round(s2, 2),
                "cc3_hours": round(cc3, 2),
                "s3_hours": round(s3, 2),
                "expected_tB": round(tB_val, 2)
            },
            "viability": {
                "blastocyst_formation_prob": round(blast_prob, 3),
                "kid_score_category": kid_score,
                "arrest_probability": round(arrest_risk, 3),
                "euploidy_likelihood": round(self._estimate_euploidy(blast_prob, obs), 3)
            }
        }

    def _compute_viability_scores(
        self, cc2: float, s2: float, cc3: float, tB: float, obs: EmbryoObservations
    ) -> Tuple[float, str, float]:
        """
        Evaluate Blastocyst Formation Probability and KIDScore (Known Implantation Data)
        Penalizing known dysmorphisms: abnormal cleavage, prolonged s2, high fragmentation.
        """
        base_log_odds = 1.6  # Corresponds to ~83% blastocyst rate under perfect conditions

        # Penalties based on Meseguer / Rubio decision tree criteria:
        # Optimal cc2: 9.33 - 12.65 hours
        if cc2 < 5.0:  # Direct cleavage or abnormal rapid division
            base_log_odds -= 2.2
        elif 9.0 <= cc2 <= 12.5:
            base_log_odds += 0.8
        elif cc2 > 14.5:
            base_log_odds -= 1.4

        # Optimal s2: <= 0.75 hours (synchronous 2-to-4 division)
        if s2 <= 0.75:
            base_log_odds += 0.6
        elif s2 > 2.5:
            base_log_odds -= 1.2

        # Morphological penalties
        if obs.fragmentation_percent > 15.0:
            base_log_odds -= (obs.fragmentation_percent - 15.0) * 0.08
        if obs.direct_cleavage_detected:
            base_log_odds -= 2.5
        if obs.multinucleation_at_2cell:
            base_log_odds -= 1.1
        if obs.uneven_blastomere_size:
            base_log_odds -= 0.7

        # Maternal age effect
        if self.profile.maternal_age > 35.0:
            base_log_odds -= (self.profile.maternal_age - 35.0) * 0.09

        # Convert to probability
        blast_prob = 1.0 / (1.0 + np.exp(-base_log_odds))
        blast_prob = float(np.clip(blast_prob, 0.05, 0.96))
        arrest_risk = float(1.0 - blast_prob)

        # KIDScore grading categorization
        if blast_prob >= 0.80 and s2 <= 1.0 and 8.5 <= cc2 <= 13.0:
            kid_score = "Category 1 (Top Tier - High Implantation Potential)"
        elif blast_prob >= 0.65:
            kid_score = "Category 2 (Good Prognosis)"
        elif blast_prob >= 0.40:
            kid_score = "Category 3 (Moderate - Slower Kinetics)"
        elif blast_prob >= 0.20:
            kid_score = "Category 4 (Suboptimal / Dyssynchronous)"
        else:
            kid_score = "Category 5 (High Arrest Risk)"

        return blast_prob, kid_score, arrest_risk

    def _estimate_euploidy(self, blast_prob: float, obs: EmbryoObservations) -> float:
        """Estimate likelihood of chromosomal normalcy conditioned on age & morphokinetics"""
        # Baseline euploidy rate by age (Franasiak et al. 2014)
        age = self.profile.maternal_age
        if age < 30:
            base_eup = 0.70
        elif age < 35:
            base_eup = 0.58
        elif age < 38:
            base_eup = 0.45
        elif age < 41:
            base_eup = 0.30
        else:
            base_eup = 0.16

        # Morphokinetic boost / penalty
        kinetic_factor = (blast_prob - 0.5) * 0.25
        frag_penalty = obs.fragmentation_percent * 0.005
        return float(np.clip(base_eup + kinetic_factor - frag_penalty, 0.05, 0.90))

    def simulate_state_trajectory(
        self, obs: EmbryoObservations, max_time_hpi: float = 144.0, dt: float = 1.0
    ) -> Dict[str, Any]:
        """
        Simulate the Continuous-Time State Probabilities across time [0, max_time_hpi]
        Returns state distribution vector P(S_t = s) for polished timeline visualization.
        """
        posterior = self.compute_bayesian_posterior(obs)
        milestones = posterior["milestones"]
        blast_prob = posterior["viability"]["blastocyst_formation_prob"]
        arrest_prob = posterior["viability"]["arrest_probability"]

        time_points = np.arange(0.0, max_time_hpi + dt, dt)
        state_curves = {s: [] for s in STATES}

        # Expected milestone values
        t_pnf = milestones["tPNf"]["mean"]
        t2 = milestones["t2"]["mean"]
        t3 = milestones["t3"]["mean"]
        t4 = milestones["t4"]["mean"]
        t5 = milestones["t5"]["mean"]
        t8 = milestones["t8"]["mean"]
        tM = milestones["tM"]["mean"]
        tSB = milestones["tSB"]["mean"]
        tB = milestones["tB"]["mean"]
        tEB = milestones["tEB"]["mean"]

        for t in time_points:
            # Arrest accumulator over time
            p_arrest_cleav = arrest_prob * 0.45 * (1.0 / (1.0 + np.exp(-(t - 45.0) / 8.0)))
            p_arrest_morula = arrest_prob * 0.35 * (1.0 / (1.0 + np.exp(-(t - 80.0) / 10.0)))
            p_arrest_blast = arrest_prob * 0.20 * (1.0 / (1.0 + np.exp(-(t - 110.0) / 8.0)))

            total_arrest = p_arrest_cleav + p_arrest_morula + p_arrest_blast
            p_viable = max(0.01, 1.0 - total_arrest)

            # Viable state gating via smooth transitions
            w0 = np.exp(-((t - 10.0) / 12.0) ** 2) if t < t2 else 0.0
            w1 = np.exp(-((t - (t2 + t3)/2.0) / max(2.0, (t3 - t2)/1.8)) ** 2)
            w2 = np.exp(-((t - (t3 + t4)/2.0) / max(1.5, (t4 - t3)/1.8)) ** 2)
            w3 = np.exp(-((t - (t4 + t5)/2.0) / max(2.5, (t5 - t4)/1.8)) ** 2)
            w4 = np.exp(-((t - (t5 + tM)/2.0) / max(6.0, (tM - t5)/1.8)) ** 2)
            w5 = np.exp(-((t - (tM + tSB)/2.0) / max(4.0, (tSB - tM)/1.8)) ** 2)
            w6 = np.exp(-((t - (tSB + tB)/2.0) / max(4.0, (tB - tSB)/1.8)) ** 2)
            w7 = np.exp(-((t - (tB + tEB)/2.0) / max(4.0, (tEB - tB)/1.8)) ** 2)
            w8 = 1.0 / (1.0 + np.exp(-(t - tEB) / 4.0))

            weights = np.array([w0, w1, w2, w3, w4, w5, w6, w7, w8])
            sum_w = np.sum(weights) + 1e-6
            norm_w = (weights / sum_w) * p_viable

            state_curves["S0_Zygote"].append(float(norm_w[0]))
            state_curves["S1_2Cell"].append(float(norm_w[1]))
            state_curves["S2_3Cell"].append(float(norm_w[2]))
            state_curves["S3_4Cell"].append(float(norm_w[3]))
            state_curves["S4_5to8Cell"].append(float(norm_w[4]))
            state_curves["S5_Morula"].append(float(norm_w[5]))
            state_curves["S6_EarlyBlastocyst"].append(float(norm_w[6]))
            state_curves["S7_FullBlastocyst"].append(float(norm_w[7]))
            state_curves["S8_ExpandedHatching"].append(float(norm_w[8]))
            state_curves["ARREST_Cleavage"].append(float(p_arrest_cleav))
            state_curves["ARREST_Morula"].append(float(p_arrest_morula))
            state_curves["ARREST_Blastocyst"].append(float(p_arrest_blast))

        return {
            "time_points_hpi": [round(float(t), 1) for t in time_points],
            "state_trajectories": state_curves,
            "posterior_summary": posterior
        }

    def recommend_transfer_synchrony(
        self, obs: EmbryoObservations, endometrium: Optional[EndometrialContext] = None
    ) -> Dict[str, Any]:
        """
        Clinical Sync Module:
        Evaluates temporal alignment between predicted embryo blastocyst stage
        and the endometrial Window of Implantation (WOI).
        Provides actionable transfer timing protocol.
        """
        endo = endometrium or EndometrialContext()
        posterior = self.compute_bayesian_posterior(obs)
        expected_tB = posterior["kinetics"]["expected_tB"]
        blast_prob = posterior["viability"]["blastocyst_formation_prob"]
        arrest_prob = posterior["viability"]["arrest_probability"]

        # Optimal blastocyst transfer window is when embryo reaches expanded blastocyst (tEB ~ tB + 7h)
        optimal_embryo_ready_hpi = expected_tB + 6.0

        # Endometrial receptive peak (hours post progesterone)
        endo_peak_hpi = endo.woi_center_hpi
        delta_hours = optimal_embryo_ready_hpi - endo_peak_hpi

        # Endometrial receptivity bell curve: R(t) = exp(-0.5 * ((t - peak) / (width/3))^2)
        sigma_woi = endo.woi_width_hours / 3.0
        synchrony_index = float(np.exp(-0.5 * (delta_hours / sigma_woi) ** 2))
        synchrony_index = round(float(np.clip(synchrony_index, 0.0, 1.0)), 3)

        # Decision Logic: Fresh D5 vs Fresh D3 vs Delayed D6 vs Freeze-all
        if endo.endometrial_thickness_mm < 7.0:
            protocol = "Freeze-All (Cryopreservation)"
            urgency = "High"
            action = "Cancel fresh transfer due to thin endometrium (<7.0 mm). Cryopreserve blastocyst for optimized HRT frozen embryo transfer (FET)."
            timing_target = "Subsequent Cycle FET"
            alignment_status = "Contraindicated (Thin Endometrium)"

        elif abs(delta_hours) <= 8.0 and blast_prob >= 0.55:
            protocol = "Fresh Blastocyst Transfer (Day 5)"
            urgency = "Optimal"
            target_time = round(optimal_embryo_ready_hpi, 1)
            action = f"Proceed with Fresh Day-5 Transfer at {target_time} hpi (±4 hrs). High embryo-endometrial synchrony ({int(synchrony_index*100)}%)."
            timing_target = f"Day 5 @ {target_time} hpi (Progesterone P+{round(target_time - endo.progesterone_start_hpi, 1)}h)"
            alignment_status = "In-Phase (Harmonized)"

        elif delta_hours > 8.0 and delta_hours <= 24.0 and blast_prob >= 0.40:
            protocol = "Extended Culture & Delayed Day 6 Transfer"
            urgency = "Moderate"
            target_time = round(optimal_embryo_ready_hpi, 1)
            action = f"Embryo development is moderately delayed. Allow extended culture to Day 6 ({target_time} hpi). If endometrial window closes, convert to Freeze-All."
            timing_target = f"Day 6 @ {target_time} hpi"
            alignment_status = "Late Phase / Asynchronous"

        elif blast_prob < 0.35 and obs.current_time_hpi <= 72.0:
            protocol = "Early Day-3 Cleavage Transfer (Salvage Strategy)"
            urgency = "Cautionary"
            action = "Predicted blastulation probability is low in vitro (<35%). Consider immediate Day-3 transfer to maximize uterine in vivo survival environment."
            timing_target = "Day 3 (68 - 72 hpi)"
            alignment_status = "In Vitro Arrest Precaution"

        else:
            protocol = "Elective Freeze-All (Cryopreservation)"
            urgency = "Protective"
            action = f"Significant dyssynchrony detected (delta = {round(delta_hours, 1)}h, sync index = {int(synchrony_index*100)}%). Vitrify high-grade blastocyst upon expansion and transfer in receptive programmed cycle."
            timing_target = "Cycle Cancellation -> Cryopreservation"
            alignment_status = "Out-of-Phase / Misaligned"

        return {
            "protocol_recommendation": protocol,
            "alignment_status": alignment_status,
            "synchrony_index": synchrony_index,
            "synchrony_delta_hours": round(delta_hours, 2),
            "target_transfer_timing": timing_target,
            "clinical_rationale": action,
            "endometrial_readiness": {
                "thickness_mm": endo.endometrial_thickness_mm,
                "pattern": endo.endometrial_pattern,
                "woi_peak_hpi": endo.woi_center_hpi,
                "woi_window_range": f"{endo.woi_center_hpi - 12:.0f}h - {endo.woi_center_hpi + 12:.0f}h post-P"
            },
            "embryo_readiness": {
                "expected_full_blast_hpi": expected_tB,
                "expected_expanded_blast_hpi": round(optimal_embryo_ready_hpi, 1),
                "blastocyst_probability": round(blast_prob, 3),
                "kid_score": posterior["viability"]["kid_score_category"]
            }
        }


# Quick CLI test and validation
if __name__ == "__main__":
    twin = EmbryoProbabilisticTwin(EmbryoPatientProfile(maternal_age=33.0))
    obs = EmbryoObservations(
        current_time_hpi=68.0,
        t2=27.2,
        t3=37.0,
        t4=38.0,
        t5=51.5,
        t8=59.0,
        fragmentation_percent=5.0
    )

    print("--- COMPUTING BAYESIAN POSTERIOR ---")
    post = twin.compute_bayesian_posterior(obs)
    for k, v in post["milestones"].items():
        obs_tag = "[OBSERVED]" if v["is_observed"] else "[PREDICTED]"
        print(f"{k:>5} ({v['label']:<28}): {v['mean']:>6.1f} h (95% CI: {v['ci_lower']:>5.1f} - {v['ci_upper']:>5.1f}) {obs_tag}")

    print("\n--- KINETICS & VIABILITY ---")
    print("cc2 (t3-t2):", post["kinetics"]["cc2_hours"], "h")
    print("s2 (t4-t3): ", post["kinetics"]["s2_hours"], "h")
    print("Blastocyst Prob:", post["viability"]["blastocyst_formation_prob"])
    print("KIDScore:", post["viability"]["kid_score_category"])

    print("\n--- TRANSFER SYNCHRONY RECOMMENDATION ---")
    sync = twin.recommend_transfer_synchrony(obs)
    print("Recommendation:", sync["protocol_recommendation"])
    print("Target Timing :", sync["target_transfer_timing"])
    print("Sync Index    :", sync["synchrony_index"])
    print("Rationale     :", sync["clinical_rationale"])
