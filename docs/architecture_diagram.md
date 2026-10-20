# System Architecture Specification
## Embryo Trajectory Digital Twin (Probabilistic State Model & Endometrial Synchronizer)

```mermaid
flowchart TD
    subgraph SENSORS ["1. Morphokinetic & Clinical Data Acquisition"]
        direction TB
        A1["Time-Lapse Incubator Image Series (EmbryoScope / ASTEC)"]
        A2["Automated or Manual Checkpoint Annotation (t₂, t₃, t₄, t₅, t₈)"]
        A3["Patient Profile (Maternal Age, AMH, Baseline BMI, Incubator Gas 5% vs 20% O₂)"]
        A4["Morphological Dysmorphisms (Cellular Fragmentation %, Direct Cleavage 1→3 skip)"]
    end

    subgraph PROB_ENGINE ["2. Continuous-Time Bayesian State Model"]
        direction TB
        B1["Multivariate Gaussian Prior (Autoregressive Temporal Correlation ρ = 0.88)"]
        B2["Bayesian Posterior Conditioning: P(T_future | T_obs = y)"]
        B3["Morphokinetic Parameter Derivation: cc2 = t₃-t₂, s₂ = t₄-t₃, cc3 = t₅-t₃"]
        B4["Continuous Markov State Curve Generator: P(S_t = s) across 0-144 hpi"]
        B5["Viability Logistic Hazard & KIDScore Classifier (Category 1 to 5)"]
    end

    subgraph INTERACTIVE_UI ["3. Interactive Digital Twin Dashboard"]
        direction TB
        C1["0-144 hpi Morphokinetic Timeline with Bayesian 95% Credible Interval Bands"]
        C2["Procedural SVG Morphology Avatar (Zygote 2PN → Cleavage → Morula → Full Blastocyst)"]
        C3["Counterfactual 'What-If' Sliders (Maternal Age, cc2, s2, Fragmentation, Oxygen)"]
        C4["Archetype Clinical Presets (Top-Tier Euploid, Delayed Cleaver, Direct Cleavage Alert)"]
        C5["Dual-Twin Baseline vs Counterfactual Comparison Overlay"]
    end

    subgraph SYNC_MODULE ["4. Endometrial Transfer Synchrony Module"]
        direction TB
        D1["Endometrial Receptivity Model R(t) (Peak @ P+120h, ±12h Receptive Window)"]
        D2["Synchrony Delta Engine: Δτ = t_blast_expansion - t_woi_peak"]
        D3["Endometrial Ultrasound Lining Assessment (Thickness ≥ 7.0mm, Trilaminar Pattern)"]
        D4["Clinical Decision Protocol Engine:"]
        D4a["• Fresh Day-5 Blastocyst Transfer (In-Phase, Δτ within ±7h)"]
        D4b["• Extended Day-6 Transfer (Late-Phase / Slower Kinetics)"]
        D4c["• Immediate Day-3 Salvage Transfer (In Vitro Arrest Hazard >65%)"]
        D4d["• Elective Freeze-All Vitrification (Out-of-Phase / Thin Lining)"]
    end

    SENSORS --> PROB_ENGINE
    PROB_ENGINE --> INTERACTIVE_UI
    PROB_ENGINE --> SYNC_MODULE
    INTERACTIVE_UI <--> SYNC_MODULE
```

### Data Flow & Component Mapping
1. **Inputs:** Incubator time-lapse events and patient clinical history.
2. **State Model Engine (`embryo_model.py` / `probabilisticModel.ts`):** Converts sparse observations into closed-form posterior distributions without requiring external API calls or black-box neural networks.
3. **Reactive UI (`TimelineVisualizer.tsx` / `EmbryoAvatar.tsx` / `WhatIfSliders.tsx`):** Real-time interactive simulation at 60 FPS.
4. **Clinical Synchrony Engine (`TransferSyncModule.tsx`):** Connects the embryo's arrival timing with uterine receptivity to prescribe individualized transfer timing.
