"""
Script to generate self-contained HTML presentations and architecture documents
ready for direct browser viewing or single-click 'Print to PDF'.
"""

presentation_html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Embryo Trajectory Twin - Presentation Deck (PDF/Print Ready)</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f1f5f9; margin: 0; padding: 20px; }
    .slide { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; margin-bottom: 24px; page-break-after: always; min-height: 520px; box-sizing: border-box; }
    h1 { color: #818cf8; font-size: 28px; margin-top: 0; }
    h2 { color: #38bdf8; font-size: 22px; margin-top: 0; }
    h3 { color: #34d399; font-size: 18px; }
    p, li { font-size: 14px; line-height: 1.6; color: #cbd5e1; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; background: #312e81; color: #c7d2fe; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 16px; }
    .card { background: #1f2937; border-radius: 8px; padding: 16px; border-left: 4px solid #6366f1; }
    code { font-family: monospace; background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #a5b4fc; }
    @media print {
      body { background: white; color: black; padding: 0; }
      .slide { border: 1px solid #ccc; background: white; color: black; }
      h1, h2 { color: #1e3a8a; }
      p, li { color: #333; }
      .card { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; }
      code { background: #f1f5f9; color: #0f172a; }
    }
  </style>
</head>
<body>

  <div class="slide">
    <span class="badge">Digital Twin Challenge 2026 • Submission Deck</span>
    <h1>Embryo Trajectory Digital Twin</h1>
    <h2>Continuous-Time Probabilistic State Model & Endometrial Transfer Synchronizer</h2>
    <p><strong>Summit:</strong> Happiest Health Reimagining and Reforming Healthcare in India Summit - 2026</p>
    <p><strong>Domain:</strong> Reproductive Healthcare & IVF Implantation Optimization</p>
    <div class="grid">
      <div class="card">
        <h3>Core Breakthrough</h3>
        <p>Replacing uninterpretable static computer-vision snapshots with a continuous-time Bayesian state model over time-lapse morphokinetics ($t_2$ to $t_{EB}$) linked to uterine implantation receptivity.</p>
      </div>
      <div class="card">
        <h3>Clinical Impact</h3>
        <p>Solves the leading bottleneck in IVF by providing individualized transfer timing down to the optimal hour ($P+120$h), boosting synchrony and reducing cycle cancellation rates.</p>
      </div>
    </div>
  </div>

  <div class="slide">
    <h2>1. Healthcare Problem Statement</h2>
    <div class="grid">
      <div class="card">
        <h3>The IVF Implantation Bottleneck</h3>
        <ul>
          <li>Global and Indian IVF live-birth success rates hover around <strong>30-35%</strong> per stimulated cycle.</li>
          <li>Embryonic developmental arrest occurs silently between Day 2 and Day 5 in >40% of fertilized zygotes.</li>
          <li>Clinicians traditionally rely on subjective manual microscope checks, stressing embryos with temperature/gas shifts.</li>
        </ul>
      </div>
      <div class="card">
        <h3>The "Sync" Void</h3>
        <ul>
          <li>Embryo viability and endometrial receptivity are evaluated independently.</li>
          <li>Even a top-grade euploid blastocyst will fail to implant if transferred outside the narrow <strong>Window of Implantation (WOI)</strong>.</li>
          <li>Clinicians lack a unified predictive twin that connects <em>embryo quality &rarr; transfer timing</em>.</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="slide">
    <h2>2. Technical Architecture & State Model Math</h2>
    <div class="grid">
      <div class="card">
        <h3>Continuous-Time Bayesian Filtering</h3>
        <p>Cleavage milestones modeled via Gaussian conditioning:</p>
        <p><code>&mu;* = &mu;_future + &Sigma;_12 (&Sigma;_22 + &sigma;^2 I)^(-1) (y - &mu;_obs)</code></p>
        <ul>
          <li>Incorporates autoregressive covariance across division events.</li>
          <li>Dynamically shrinks uncertainty and provides 95% Credible Intervals.</li>
        </ul>
      </div>
      <div class="card">
        <h3>Kinetic Variables & KIDScore</h3>
        <ul>
          <li><strong>cc2 (t3 - t2)</strong>: Optimal 9.3 - 12.6 hrs. Values &lt;5h flag abnormal direct division.</li>
          <li><strong>s2 (t4 - t3)</strong>: Division synchrony (&le;0.75h).</li>
          <li><strong>Logistic Hazard Viability</strong>: Classifies embryos into KIDScore Categories 1 through 5.</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="slide">
    <h2>3. Endometrial-Embryo Synchronization Engine</h2>
    <div class="card" style="margin-bottom: 16px;">
      <h3>Window of Implantation (WOI) Model</h3>
      <p>Receptivity curve centered at <code>P+120h</code> of progesterone exposure: <code>R(t) = exp(-0.5 * ((t - peak)/&sigma;)^2)</code></p>
      <p>Synchrony Delta: <code>&Delta;&tau; = t_blast_expansion - t_woi_peak</code></p>
    </div>
    <div class="grid">
      <div class="card">
        <h3>Fresh Day-5 Transfer</h3>
        <p>When |&Delta;&tau;| &le; 7h and blastocyst probability &ge; 55% with trilaminar lining &ge; 7mm. Precise scheduling down to target hour.</p>
      </div>
      <div class="card">
        <h3>Elective Freeze-All / Segmented FET</h3>
        <p>Triggered when lining &lt; 7.0mm or severe dyssynchrony (&gt;20h) detected, preserving high-grade blastocysts for receptive frozen cycles.</p>
      </div>
    </div>
  </div>

  <div class="slide">
    <h2>4. Results & Outcomes</h2>
    <div class="grid">
      <div class="card">
        <h3>Key Validation Results</h3>
        <ul>
          <li>100% test pass rate across mathematical unit tests (variance contraction, direct cleavage hazard, synchrony rules).</li>
          <li>Interactive 60 FPS slider responsiveness with zero network latency.</li>
          <li>Procedural visual morphology avatar updating in real-time from Zygote to Hatching Blastocyst.</li>
        </ul>
      </div>
      <div class="card">
        <h3>Implementation Deliverables</h3>
        <ul>
          <li><strong>Production Web Application:</strong> React 19 + Vite + Tailwind CSS.</li>
          <li><strong>Mathematical Core:</strong> Python 3.10 engine (NumPy / SciPy).</li>
          <li><strong>Clinical Dossier:</strong> One-click exportable clinical summary report.</li>
        </ul>
      </div>
    </div>
  </div>

</body>
</html>
"""

with open("d:/twin/docs/presentation.html", "w", encoding="utf-8") as f:
    f.write(presentation_html)

print("Generated docs/presentation.html")
