"""
Unit and Clinical Validation Suite for Embryo Trajectory Twin
Verifies mathematical consistency, Bayesian conditioning, and transfer synchronization.
"""

import unittest
import numpy as np
from embryo_model import (
    EmbryoProbabilisticTwin,
    EmbryoPatientProfile,
    EmbryoObservations,
    EndometrialContext,
    CANONICAL_MILESTONES,
    MILESTONE_KEYS
)


class TestEmbryoProbabilisticTwin(unittest.TestCase):

    def setUp(self):
        self.twin = EmbryoProbabilisticTwin(EmbryoPatientProfile(maternal_age=31.0))

    def test_bayesian_conditioning_reduces_variance(self):
        """Observed milestones must have near-zero uncertainty and narrow future predictions"""
        obs = EmbryoObservations(
            current_time_hpi=60.0,
            t2=27.0,
            t3=36.8,
            t4=37.5,
            t5=51.0,
            t8=58.0
        )
        post = self.twin.compute_bayesian_posterior(obs)
        milestones = post["milestones"]

        # Observed milestones have sd == 0
        self.assertEqual(milestones["t2"]["sd"], 0.0)
        self.assertEqual(milestones["t3"]["sd"], 0.0)
        self.assertEqual(milestones["t8"]["sd"], 0.0)

        # Unobserved future milestone tB has smaller variance than canonical prior
        canonical_tb_sd = CANONICAL_MILESTONES["tB"]["sd"]
        self.assertLess(milestones["tB"]["sd"], canonical_tb_sd)

    def test_direct_cleavage_arrest_penalty(self):
        """Direct cleavage (1 -> 3 cells, cc2 < 5h) must drastically spike arrest hazard"""
        normal_obs = EmbryoObservations(current_time_hpi=45.0, t2=27.0, t3=37.0, t4=38.0)
        direct_cleave_obs = EmbryoObservations(
            current_time_hpi=45.0, t2=25.0, t3=26.5, t4=38.0, direct_cleavage_detected=True
        )

        post_norm = self.twin.compute_bayesian_posterior(normal_obs)
        post_abn = self.twin.compute_bayesian_posterior(direct_cleave_obs)

        prob_norm = post_norm["viability"]["blastocyst_formation_prob"]
        prob_abn = post_abn["viability"]["blastocyst_formation_prob"]

        self.assertGreater(prob_norm, 0.70)
        self.assertLess(prob_abn, 0.35)
        self.assertIn("Category", post_abn["viability"]["kid_score_category"])

    def test_transfer_synchrony_in_phase(self):
        """Embryo expanding at ~120h with healthy 9.5mm endometrium must yield Fresh D5 transfer"""
        obs = EmbryoObservations(
            current_time_hpi=65.0,
            t2=27.0,
            t3=37.0,
            t4=37.8,
            t5=51.0,
            t8=58.5
        )
        endo = EndometrialContext(endometrial_thickness_mm=9.5, woi_center_hpi=120.0)
        sync = self.twin.recommend_transfer_synchrony(obs, endo)

        self.assertEqual(sync["protocol_recommendation"], "Fresh Blastocyst Transfer (Day 5)")
        self.assertEqual(sync["alignment_status"], "In-Phase (Harmonized)")
        self.assertGreaterEqual(sync["synchrony_index"], 0.90)

    def test_transfer_synchrony_thin_endometrium_freeze_all(self):
        """Endometrium < 7mm must strictly enforce cycle vitrification / Freeze-All"""
        obs = EmbryoObservations(current_time_hpi=65.0, t2=27.0, t3=37.0, t4=37.8)
        endo = EndometrialContext(endometrial_thickness_mm=5.8, woi_center_hpi=120.0)
        sync = self.twin.recommend_transfer_synchrony(obs, endo)

        self.assertEqual(sync["protocol_recommendation"], "Freeze-All (Cryopreservation)")
        self.assertIn("Thin Endometrium", sync["alignment_status"])

    def test_salvage_day3_transfer_on_poor_prognosis(self):
        """Embryo with multiple severe dysmorphisms on Day 3 should trigger Day 3 salvage"""
        obs = EmbryoObservations(
            current_time_hpi=68.0,
            t2=34.0,
            t3=35.0,
            t4=46.0,
            fragmentation_percent=32.0,
            direct_cleavage_detected=True,
            multinucleation_at_2cell=True
        )
        twin_older = EmbryoProbabilisticTwin(EmbryoPatientProfile(maternal_age=42.0))
        sync = twin_older.recommend_transfer_synchrony(obs)

        self.assertEqual(sync["protocol_recommendation"], "Early Day-3 Cleavage Transfer (Salvage Strategy)")


if __name__ == "__main__":
    unittest.main()
