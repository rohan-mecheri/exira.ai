import type { SchemaId } from "@/lib/isolation";

/* Section 02's schematic.

   The first version was a flat left-to-right chain of five boxes, which
   drew the pipeline but not the claim. The claim is that there is a
   boundary we cannot cross, so the boundary is now the subject: a ruled
   line down the middle, everything the target authorises on its side,
   Exira on the other, and exactly one opening in it. The export policy
   sits in that opening, because it is the only thing that crosses. The
   return path stops dead against the line.

   The credential broker is gone as a named node. It was the one part of
   the diagram that described how we do it rather than what is true.

   Which parts are lit is derived from the active stage rather than
   toggled by hand, so the two cannot drift apart. */

export function PipelineSchematic({ step, hot }: { step: number; hot: readonly SchemaId[] }) {
  const on = (id: SchemaId, base: "nd" | "fl" | "bd") => (hot.includes(id) ? `${base} hot` : base);

  return (
    <svg
      id="schema"
      data-step={step}
      viewBox="0 0 700 206"
      role="img"
      aria-label="Schematic: the target authorises a sealed enclave on its side of a trust boundary. Findings cross the boundary through an export policy to Exira. There is no path back across."
    >
      <defs>
        <marker
          id="ah"
          viewBox="0 0 8 8"
          refX="6.4"
          refY="4"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0 .6 7 4 0 7.4Z" fill="#234D9E" />
        </marker>
        <linearGradient id="cg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06307C" />
          <stop offset="100%" stopColor="#6F92D7" />
        </linearGradient>
      </defs>

      <g fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#5D7092">
        {/* Which side of the line you are on */}
        <text x="6" y="14" fontSize="8" letterSpacing="1.1" fill="#8D9BB4">
          TARGET SIDE
        </text>
        <text x="694" y="14" fontSize="8" letterSpacing="1.1" fill="#8D9BB4" textAnchor="end">
          EXIRA SIDE
        </text>

        {/* The boundary, interrupted only by the export policy */}
        <g className={on("n-boundary", "bd")} id="n-boundary">
          <path d="M504 22 V66" stroke="#234D9E" strokeDasharray="3 5" fill="none" />
          <path d="M504 132 V184" stroke="#234D9E" strokeDasharray="3 5" fill="none" />
        </g>

        <g className={on("n-target", "nd")} id="n-target">
          <rect x="6" y="66" width="112" height="64" rx="3" fill="#FCFDFF" stroke="#D8DFEA" />
          <text x="62" y="92" textAnchor="middle" fill="#001448" letterSpacing=".7">
            TARGET
          </text>
          <text x="62" y="109" textAnchor="middle" fontSize="8.5">
            defines scope
          </text>
        </g>

        <g className={on("n-enclave", "nd")} id="n-enclave">
          <rect
            x="178"
            y="30"
            width="246"
            height="136"
            rx="4"
            fill="rgba(35,77,158,.05)"
            stroke="#234D9E"
            strokeDasharray="5 4"
          />
          <text x="301" y="50" textAnchor="middle" fill="#234D9E" fontSize="9.5" letterSpacing="1.1">
            SEALED ENCLAVE
          </text>
          <path d="M301 76 345 98 301 120 257 98Z" fill="url(#cg2)" />
          <path
            d="M301 90 345 112 301 134 257 112Z"
            fill="none"
            stroke="#426EB7"
            strokeWidth="1.2"
            opacity=".45"
          />
          <path
            d="M301 102 345 124 301 146 257 124Z"
            fill="none"
            stroke="#426EB7"
            strokeWidth="1.1"
            opacity=".24"
          />
          <text x="301" y="159" textAnchor="middle" fontSize="8.5">
            eleven modules · critic pass
          </text>
        </g>

        <g className={on("n-policy", "nd")} id="n-policy">
          <rect x="452" y="66" width="104" height="64" rx="3" fill="#FCFDFF" stroke="#234D9E" />
          <text x="504" y="92" textAnchor="middle" fill="#001448" letterSpacing=".7">
            POLICY
          </text>
          <text x="504" y="109" textAnchor="middle" fontSize="8.5">
            the only opening
          </text>
        </g>

        <g className={on("n-exira", "nd")} id="n-exira">
          <rect x="600" y="66" width="94" height="64" rx="3" fill="#06307C" />
          <text
            x="647"
            y="93"
            textAnchor="middle"
            fontSize="12"
            fontFamily="Instrument Sans, sans-serif"
            fill="#fff"
          >
            exira
          </text>
          <text x="647" y="110" textAnchor="middle" fontSize="7.5" fill="#9DB2D8">
            findings only
          </text>
        </g>

        <g className={on("f-auth", "fl")} id="f-auth">
          {/* Unlabelled on purpose: the gap is too narrow to letter without
              touching both boxes, and "defines scope" already says it. */}
          <path d="M120 98 H174" stroke="#234D9E" fill="none" markerEnd="url(#ah)" />
        </g>
        <g className={on("f-out", "fl")} id="f-out">
          <path d="M424 98 H448" stroke="#234D9E" fill="none" markerEnd="url(#ah)" />
        </g>
        <g className={on("f-del", "fl")} id="f-del">
          <path d="M556 98 H596" stroke="#234D9E" fill="none" markerEnd="url(#ah)" />
        </g>
        <g className={on("f-clone", "fl")} id="f-clone">
          <path d="M301 8 V26" stroke="#234D9E" fill="none" markerEnd="url(#ah)" />
          <text x="311" y="14" fontSize="8" fill="#5D7092">
            source arrives direct from the provider
          </text>
        </g>

        {/* The return path exists only to be stopped */}
        <g className={on("f-block", "fl")} id="f-block">
          <path d="M600 176 H516" stroke="#8D9BB4" strokeDasharray="4 4" fill="none" />
          <g transform="translate(504 176)">
            <circle r="7.5" fill="#FCFDFF" stroke="#8D9BB4" />
            <path d="M-3 -3 3 3M3 -3-3 3" stroke="#8D9BB4" strokeWidth="1.3" />
          </g>
          <text x="558" y="196" textAnchor="middle" fontSize="8" fill="#8D9BB4">
            no path back across
          </text>
        </g>
      </g>
    </svg>
  );
}
