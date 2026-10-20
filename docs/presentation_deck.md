# Digital Twin Challenge 2026 Presentation Deck
## Embryo Trajectory Twin: Probabilistic State Model & Endometrial Synchronizer
*Happiest Health Reimagining and Reforming Healthcare in India Summit - 2026*

---

### Slide 1: Title & Executive Summary
- **Project Title**: Embryo Trajectory Twin (Continuous-Time Probabilistic State Model & Endometrial Synchronizer)
- **Challenge Track**: Digital Twin Healthcare Challenge 2026 (Reproductive Health & IVF Optimization)
- **Core Innovation**: Moving beyond black-box computer vision to a biological continuous-time Bayesian state model over morphokinetic division timings ($t_2, t_3, t_4, t_5, t_8, t_M, t_{SB}, t_B, t_{EB}$) coupled with an Endometrial Receptivity Synchronization Engine.

---

### Slide 2: The Healthcare Problem Statement
- **The Bottleneck**: In Vitro Fertilization (IVF) has an average live birth rate of only ~30-35% per cycle. Embryo selection and implantation timing are the primary failure points.
- **Current Limitations**:
  - Manual microscopic inspection is subjective (inter-observer variance >25%).
  - Pure computer-vision models operate as uninterpretable black boxes and predict static snapshot quality without biological causality.
  - Embryo development and uterine endometrial receptivity are evaluated in silos. If an embryo reaches blastocyst out of phase with the Window of Implantation (WOI), transfer fails despite embryo quality.

---

### Slide 3: Proposed Solution - The Dynamic Digital Twin
- A **Probabilistic Digital Twin** maintaining an updated posterior belief distribution over embryonic cleavage timings:
  - Updates continuously as sparse time-lapse incubator sensor checkpoints arrive.
  - Predicts blastocyst formation probability, developmental arrest hazard, and KIDScore grade with 95% Credible Intervals.
  - Interactive What-If counterfactual simulation engine (maternal age, division delays, fragmentation, direct cleavage).
  - Endometrial Synchrony Engine: Directly links embryo blastulation timing to optimal uterine transfer scheduling.

---

### Slide 4: AI/ML State Model & Mathematical Formulation
- **Continuous-Time Semi-Markov & Bayesian Belief Network**:
  - Prior: $\mathbf{T} \sim \mathcal{N}(\boldsymbol{\mu}(\theta_{\text{patient}}), \boldsymbol{\Sigma})$, autoregressive temporal correlation $\rho \approx 0.88$.
  - Closed-form Gaussian conditioning:
    $$\boldsymbol{\mu}^* = \boldsymbol{\mu}_{\text{future}} + \boldsymbol{\Sigma}_{12} (\boldsymbol{\Sigma}_{22} + \sigma_{\text{sensor}}^2 \mathbf{I})^{-1} (\mathbf{y} - \boldsymbol{\mu}_{\text{obs}})$$
    $$\boldsymbol{\Sigma}^* = \boldsymbol{\Sigma}_{11} - \boldsymbol{\Sigma}_{12} (\boldsymbol{\Sigma}_{22} + \sigma_{\text{sensor}}^2 \mathbf{I})^{-1} \boldsymbol{\Sigma}_{21}$$
  - Morphokinetic descriptors:
    - $cc2 = t_3 - t_2$ (optimal: 9.33–12.65h)
    - $s_2 = t_4 - t_3$ (optimal: $\le 0.75$h)
    - $cc3 = t_5 - t_3$ (optimal: 10.0–14.5h)

---

### Slide 5: The Sync Module (Embryo Quality → Transfer Timing)
- **Window of Implantation Alignment**:
  - Receptivity model: $R(t) = \exp\left(-0.5 \left(\frac{t - t_{\text{peak}}}{\sigma_{\text{WOI}}}\right)^2\right)$
  - Synchrony Delta: $\Delta \tau = t_{\text{expanded\_blast}} - t_{\text{WOI\_peak}}$
- **Clinical Prescription Matrix**:
  1. *Fresh Day-5 Transfer*: $|\Delta \tau| \le 7$h and $P(\text{Blast}) \ge 55\%$. Target hour down to $\pm 3$ hours.
  2. *Extended Day-6 Transfer*: $+7\text{h} < \Delta \tau \le 20\text{h}$. Slower kinetics, prolonged culture.
  3. *Early Day-3 Salvage*: High in vitro arrest hazard ($P < 35\%$) triggers immediate in vivo uterine rescue.
  4. *Elective Freeze-All*: Lining $<7.0$ mm or severe dyssynchrony ($|\Delta \tau| > 20$h).

---

### Slide 6: Technical Stack & Architecture
- **State Engine**: Python 3.10 (NumPy, SciPy) + TypeScript 60 FPS in-browser matrix solver.
- **Frontend / UI**: React 19, Vite 8, Tailwind CSS v4, Lucide Icons, Canvas/SVG procedural morphology twin.
- **Validation Suite**: Automated unit tests verifying Bayesian variance contraction, hazard triggers, and transfer decisions.

---

### Slide 7: Clinical Outcomes & Impact
- **End-to-End Clinical Continuity**: Connects morphokinetic trajectory predictions with actionable transfer timing.
- **Explainability**: Clear biological mechanistic rationale rather than uninterpretable CNN heatmaps.
- **Clinician Empowerment**: Interactive what-if sensitivity analysis enables embryologists to stress-test culture decisions prior to physical interventions.
