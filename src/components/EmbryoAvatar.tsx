import React from 'react';

interface EmbryoAvatarProps {
  currentHpi: number;
  posteriorKinetics: {
    t2: number;
    t3: number;
    t4: number;
    t5: number;
    t8: number;
    tM: number;
    tSB: number;
    tB: number;
    tEB: number;
  };
  fragmentationPercent: number;
  isArrested?: boolean;
  gardnerGrade?: string;
  size?: number;
}

export const EmbryoAvatar: React.FC<EmbryoAvatarProps> = ({
  currentHpi,
  posteriorKinetics,
  fragmentationPercent,
  isArrested = false,
  gardnerGrade = "4AA",
  size = 280
}) => {
  const { t2, t3, t4, t5, t8, tM, tSB, tB, tEB } = posteriorKinetics;

  // Determine embryonic morphological stage
  let stageName = "Zygote (1-Cell / Syngamy)";
  let stageCode = "S0";
  let cellCount = 1;

  if (currentHpi < t2) {
    stageName = currentHpi < 18 ? "Zygote (Pronuclear 2PN)" : "Zygote (Pronuclear Fading)";
    stageCode = "S0";
    cellCount = 1;
  } else if (currentHpi < t3) {
    stageName = "2-Cell Cleavage Stage";
    stageCode = "S1";
    cellCount = 2;
  } else if (currentHpi < t4) {
    stageName = "3-Cell Intermediate Cleavage";
    stageCode = "S2";
    cellCount = 3;
  } else if (currentHpi < t5) {
    stageName = "4-Cell Cleavage Stage";
    stageCode = "S3";
    cellCount = 4;
  } else if (currentHpi < tM) {
    stageName = currentHpi < t8 ? "5-to-7 Cell Cleavage" : "8-Cell Optimal Cleavage";
    stageCode = "S4";
    cellCount = currentHpi < t8 ? 6 : 8;
  } else if (currentHpi < tSB) {
    stageName = "Compacting Morula";
    stageCode = "S5";
    cellCount = 16;
  } else if (currentHpi < tB) {
    stageName = "Early Cavitating Blastocyst";
    stageCode = "S6";
    cellCount = 32;
  } else if (currentHpi < tEB) {
    stageName = "Full Blastocyst";
    stageCode = "S7";
    cellCount = 64;
  } else {
    stageName = currentHpi > 132 ? "Hatching Blastocyst" : "Expanded Blastocyst";
    stageCode = "S8";
    cellCount = 120;
  }

  // Generate deterministic fragmentation particles based on percentage
  const numFragments = Math.min(24, Math.floor(fragmentationPercent * 0.8));
  const fragments = Array.from({ length: numFragments }).map((_, i) => {
    const angle = (i * 137.5) * (Math.PI / 180);
    const radius = 68 + (i % 5) * 8;
    return {
      cx: 140 + radius * Math.cos(angle),
      cy: 140 + radius * Math.sin(angle),
      r: 2.5 + (i % 3) * 1.5
    };
  });

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-2xl backdrop-blur-md">
      {/* Stage Badge Header */}
      <div className="w-full flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Digital Morphology Twin
          </span>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
          {stageCode} • {currentHpi.toFixed(1)} hpi
        </span>
      </div>

      {/* SVG Canvas for Embryo Render */}
      <div className="relative group cursor-crosshair">
        <svg
          width={size}
          height={size}
          viewBox="0 0 280 280"
          className="transition-all duration-300 drop-shadow-[0_0_25px_rgba(99,102,241,0.25)]"
        >
          <defs>
            {/* Zona Pellucida Glow */}
            <radialGradient id="zonaGradient" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.08" />
              <stop offset="90%" stopColor="#818cf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.45" />
            </radialGradient>

            {/* Cytoplasm & Blastomere Gradients */}
            <radialGradient id="blastomereGrad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#cbd5e1" stopOpacity="0.85" />
              <stop offset="85%" stopColor="#64748b" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#334155" stopOpacity="0.9" />
            </radialGradient>

            <radialGradient id="blastomereGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
            </radialGradient>

            {/* Pronuclei Glow */}
            <radialGradient id="pronucleiGrad" cx="45%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#93c5fd" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
            </radialGradient>

            {/* Blastocoel Cavity Fluid */}
            <radialGradient id="blastocoelGrad" cx="60%" cy="55%" r="55%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#0f172a" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.9" />
            </radialGradient>

            {/* Inner Cell Mass (ICM) cluster */}
            <radialGradient id="icmGrad" cx="45%" cy="35%" r="55%">
              <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#9a3412" stopOpacity="0.7" />
            </radialGradient>
          </defs>

          {/* Outer Incubator Dish Grid / Micro-well Ring */}
          <circle cx="140" cy="140" r="136" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 6" opacity="0.6" />
          <circle cx="140" cy="140" r="126" fill="#090d16" stroke="#1e293b" strokeWidth="2" />

          {/* Perivitelline Space */}
          <circle cx="140" cy="140" r="102" fill="none" stroke="#475569" strokeWidth="1" opacity="0.3" />

          {/* Zona Pellucida (Thick glycoprotein coat) */}
          <circle
            cx="140"
            cy="140"
            r={stageCode === "S8" ? 116 : 108}
            fill="url(#zonaGradient)"
            stroke={isArrested ? "#ef4444" : "#60a5fa"}
            strokeWidth={stageCode === "S8" ? 3 : 6}
            strokeDasharray={stageCode === "S8" ? "120 20" : undefined}
            opacity="0.85"
          />

          {/* Polar bodies in perivitelline space */}
          <circle cx="218" cy="116" r="4.5" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1" opacity="0.8" />
          <circle cx="224" cy="125" r="3.2" fill="#64748b" stroke="#94a3b8" strokeWidth="0.8" opacity="0.7" />

          {/* --- MORPHOLOGICAL STAGES --- */}

          {/* S0: Zygote with 2PN (Pronuclei) */}
          {stageCode === "S0" && (
            <g>
              <circle cx="140" cy="140" r="88" fill="url(#blastomereGrad)" stroke="#64748b" strokeWidth="1.5" />
              {/* Ooplasm texture */}
              <circle cx="140" cy="140" r="84" fill="url(#blastomereGlow)" />
              {/* Pronuclei: Female & Male PN */}
              <circle cx="126" cy="136" r="16" fill="url(#pronucleiGrad)" stroke="#38bdf8" strokeWidth="1.2" />
              <circle cx="154" cy="144" r="18" fill="url(#pronucleiGrad)" stroke="#38bdf8" strokeWidth="1.2" />
              {/* Nucleolar precursor bodies (NPBs) */}
              <circle cx="123" cy="133" r="2.5" fill="#ffffff" />
              <circle cx="128" cy="138" r="2" fill="#ffffff" />
              <circle cx="152" cy="142" r="3" fill="#ffffff" />
              <circle cx="158" cy="147" r="2.2" fill="#ffffff" />
            </g>
          )}

          {/* S1: 2-Cell Stage */}
          {stageCode === "S1" && (
            <g>
              {/* Blastomere 1 */}
              <circle cx="106" cy="140" r="48" fill="url(#blastomereGrad)" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="106" cy="140" r="10" fill="#38bdf8" opacity="0.35" />
              <circle cx="106" cy="140" r="3" fill="#ffffff" opacity="0.9" />

              {/* Blastomere 2 */}
              <circle cx="174" cy="140" r="48" fill="url(#blastomereGrad)" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="174" cy="140" r="10" fill="#38bdf8" opacity="0.35" />
              <circle cx="174" cy="140" r="3" fill="#ffffff" opacity="0.9" />

              {/* Cleavage furrow */}
              <line x1="140" y1="96" x2="140" y2="184" stroke="#1e293b" strokeWidth="2.5" strokeOpacity="0.8" />
            </g>
          )}

          {/* S2: 3-Cell Stage */}
          {stageCode === "S2" && (
            <g>
              <circle cx="104" cy="125" r="42" fill="url(#blastomereGrad)" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="104" cy="168" r="38" fill="url(#blastomereGrad)" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="174" cy="140" r="48" fill="url(#blastomereGrad)" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="104" cy="125" r="2.5" fill="#fff" />
              <circle cx="104" cy="168" r="2.5" fill="#fff" />
              <circle cx="174" cy="140" r="3" fill="#fff" />
            </g>
          )}

          {/* S3: 4-Cell Stage */}
          {stageCode === "S3" && (
            <g>
              {/* Tetrahedral / planar 4-cell layout */}
              <circle cx="110" cy="112" r="39" fill="url(#blastomereGrad)" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="170" cy="112" r="39" fill="url(#blastomereGrad)" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="110" cy="168" r="39" fill="url(#blastomereGrad)" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="170" cy="168" r="39" fill="url(#blastomereGrad)" stroke="#94a3b8" strokeWidth="1.5" />
              {/* Nuclei */}
              <circle cx="110" cy="112" r="2.5" fill="#fff" />
              <circle cx="170" cy="112" r="2.5" fill="#fff" />
              <circle cx="110" cy="168" r="2.5" fill="#fff" />
              <circle cx="170" cy="168" r="2.5" fill="#fff" />
            </g>
          )}

          {/* S4: 5-8 Cell Stage */}
          {stageCode === "S4" && (
            <g>
              {/* Ring of 8 blastomeres */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
                const rad = (angle * Math.PI) / 180;
                const dist = 42;
                return (
                  <circle
                    key={idx}
                    cx={140 + dist * Math.cos(rad)}
                    cy={140 + dist * Math.sin(rad)}
                    r="28"
                    fill="url(#blastomereGrad)"
                    stroke="#94a3b8"
                    strokeWidth="1.2"
                  />
                );
              })}
              {/* Center cell */}
              <circle cx="140" cy="140" r="26" fill="url(#blastomereGrad)" stroke="#94a3b8" strokeWidth="1" />
            </g>
          )}

          {/* S5: Compacting Morula */}
          {stageCode === "S5" && (
            <g>
              {/* Morula with tight junctions blurring boundaries */}
              <circle cx="140" cy="140" r="82" fill="url(#blastomereGrad)" stroke="#64748b" strokeWidth="2" />
              <path
                d="M 100,120 Q 140,105 180,120 Q 195,150 170,175 Q 130,185 105,165 Z"
                fill="#38bdf8"
                opacity="0.15"
              />
              <circle cx="120" cy="130" r="14" fill="#94a3b8" opacity="0.3" />
              <circle cx="160" cy="130" r="14" fill="#94a3b8" opacity="0.3" />
              <circle cx="140" cy="160" r="14" fill="#94a3b8" opacity="0.3" />
            </g>
          )}

          {/* S6: Early Cavitating Blastocyst */}
          {stageCode === "S6" && (
            <g>
              {/* Cavity beginning to form */}
              <circle cx="140" cy="140" r="86" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
              {/* Blastocoel fluid cavity */}
              <ellipse cx="150" cy="145" rx="52" ry="46" fill="url(#blastocoelGrad)" />
              {/* Inner Cell Mass at 10 o'clock */}
              <circle cx="112" cy="120" r="26" fill="url(#icmGrad)" stroke="#ea580c" strokeWidth="1" />
              {/* Trophectoderm rim */}
              <circle cx="140" cy="140" r="86" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6 4" opacity="0.7" />
            </g>
          )}

          {/* S7: Full Blastocyst */}
          {stageCode === "S7" && (
            <g>
              <circle cx="140" cy="140" r="92" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5" />
              {/* Large Blastocoel Cavity */}
              <ellipse cx="148" cy="142" rx="66" ry="60" fill="url(#blastocoelGrad)" />
              {/* Distinct Inner Cell Mass (ICM) */}
              <ellipse cx="106" cy="116" rx="26" ry="22" fill="url(#icmGrad)" stroke="#f97316" strokeWidth="1.5" />
              {/* ICM sub-cells */}
              <circle cx="100" cy="112" r="5" fill="#fef08a" opacity="0.8" />
              <circle cx="110" cy="118" r="6" fill="#fef08a" opacity="0.8" />
              {/* Trophectoderm (TE) cellular epithelium border */}
              {Array.from({ length: 32 }).map((_, i) => {
                const angle = (i * 11.25 * Math.PI) / 180;
                return (
                  <ellipse
                    key={i}
                    cx={140 + 90 * Math.cos(angle)}
                    cy={140 + 90 * Math.sin(angle)}
                    rx="4.5"
                    ry="2.5"
                    fill="#38bdf8"
                    opacity="0.85"
                    transform={`rotate(${i * 11.25}, ${140 + 90 * Math.cos(angle)}, ${140 + 90 * Math.sin(angle)})`}
                  />
                );
              })}
            </g>
          )}

          {/* S8: Expanded / Hatching Blastocyst */}
          {stageCode === "S8" && (
            <g>
              <circle cx="140" cy="140" r="102" fill="#090d16" stroke="#818cf8" strokeWidth="1.5" />
              {/* Expansive Blastocoel */}
              <circle cx="140" cy="140" r="96" fill="url(#blastocoelGrad)" />
              {/* High grade ICM */}
              <ellipse cx="98" cy="108" rx="30" ry="26" fill="url(#icmGrad)" stroke="#f97316" strokeWidth="2" />
              {/* ICM Cells */}
              <circle cx="92" cy="104" r="6" fill="#fef08a" opacity="0.9" />
              <circle cx="104" cy="108" r="7" fill="#fef08a" opacity="0.9" />
              <circle cx="98" cy="116" r="6" fill="#fef08a" opacity="0.9" />
              {/* Trophectoderm rim */}
              {Array.from({ length: 42 }).map((_, i) => {
                const angle = (i * 8.57 * Math.PI) / 180;
                return (
                  <circle
                    key={i}
                    cx={140 + 98 * Math.cos(angle)}
                    cy={140 + 98 * Math.sin(angle)}
                    r="3.2"
                    fill="#38bdf8"
                    opacity="0.9"
                  />
                );
              })}
              {/* Hatching Herniation if > 130h */}
              {currentHpi > 130 && (
                <path
                  d="M 226,105 Q 262,118 250,146 Q 235,160 216,155 Z"
                  fill="url(#blastomereGrad)"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  opacity="0.85"
                />
              )}
            </g>
          )}

          {/* Fragmentation Particles Overlay */}
          {fragments.map((frag, idx) => (
            <circle
              key={idx}
              cx={frag.cx}
              cy={frag.cy}
              r={frag.r}
              fill="#94a3b8"
              stroke="#64748b"
              strokeWidth="0.5"
              opacity="0.75"
            />
          ))}

          {/* Arrest Overlay if embryonic arrest */}
          {isArrested && (
            <g>
              <circle cx="140" cy="140" r="92" fill="#7f1d1d" opacity="0.35" />
              <text x="140" y="145" textAnchor="middle" fill="#fca5a5" fontSize="14" fontWeight="bold" letterSpacing="2">
                DEVELOPMENTAL ARREST
              </text>
            </g>
          )}
        </svg>

        {/* Gardner Score Badge for late stage */}
        {currentHpi >= tSB && (
          <div className="absolute bottom-2 right-2 bg-slate-900/90 border border-amber-500/50 rounded-lg px-2.5 py-1 flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
            <span className="text-[10px] text-amber-400 font-semibold uppercase">Gardner:</span>
            <span className="text-xs font-mono font-bold text-amber-200">{gardnerGrade}</span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="w-full mt-3 flex items-center justify-between text-xs text-slate-300 border-t border-slate-800/80 pt-2.5">
        <div className="flex flex-col">
          <span className="font-semibold text-slate-200">{stageName}</span>
          <span className="text-[11px] text-slate-400">
            {cellCount === 1 ? '1 Blastomere' : cellCount < 16 ? `~${cellCount} Blastomeres` : `${cellCount}+ Cells`} • {fragmentationPercent}% Frag
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Status</span>
          <span className={`font-medium ${isArrested ? 'text-red-400' : 'text-emerald-400'}`}>
            {isArrested ? 'Arrested' : 'Normal Cleavage'}
          </span>
        </div>
      </div>
    </div>
  );
};
