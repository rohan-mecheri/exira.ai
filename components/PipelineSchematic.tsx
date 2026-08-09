import type { SchemaId } from "@/lib/isolation";

/* Section 02's schematic: target → broker → sealed enclave → policy → Exira.

   Which nodes and flows are lit is derived from the active stage rather
   than toggled by hand. The vanilla version cleared every .hot class and
   re-added a set on each step; here the class is just a function of props,
   so the two can't drift apart. */

export function PipelineSchematic({ step, hot }: { step: number; hot: readonly SchemaId[] }) {
  const on = (id: SchemaId, base: "nd" | "fl") => (hot.includes(id) ? `${base} hot` : base);

  return (
    <svg
      id="schema"
      data-step={step}
      viewBox="0 0 700 172"
      role="img"
      aria-label="Pipeline schematic: target, attested credential broker, sealed enclave, output policy, Exira."
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
        <g className={on("n-target", "nd")} id="n-target">
          <rect x="4" y="56" width="96" height="60" rx="3" fill="#fff" stroke="#D8DFEA" />
          <text x="52" y="80" textAnchor="middle" fill="#001448" letterSpacing=".7">
            TARGET
          </text>
          <text x="52" y="96" textAnchor="middle" fontSize="8.5">
            selects repos
          </text>
        </g>
        <g className={on("n-broker", "nd")} id="n-broker">
          <rect x="136" y="56" width="96" height="60" rx="3" fill="#fff" stroke="#D8DFEA" />
          <text x="184" y="80" textAnchor="middle" fill="#001448" letterSpacing=".7">
            BROKER
          </text>
          <text x="184" y="96" textAnchor="middle" fontSize="8.5">
            attested mint
          </text>
        </g>
        <g className={on("n-enclave", "nd")} id="n-enclave">
          <rect
            x="268"
            y="20"
            width="188"
            height="132"
            rx="4"
            fill="rgba(35,77,158,.05)"
            stroke="#234D9E"
            strokeDasharray="5 4"
          />
          <text x="362" y="40" textAnchor="middle" fill="#234D9E" fontSize="9.5" letterSpacing="1.1">
            SEALED ENCLAVE
          </text>
          <path d="M362 60 404 82 362 104 320 82Z" fill="url(#cg2)" />
          <path
            d="M362 84 404 106 362 128 320 106Z"
            fill="none"
            stroke="#426EB7"
            strokeWidth="1.2"
            opacity=".45"
          />
          <text x="362" y="146" textAnchor="middle" fontSize="8.5">
            11 modules · critic pass
          </text>
        </g>
        <g className={on("n-out", "nd")} id="n-out">
          <rect x="492" y="56" width="96" height="60" rx="3" fill="#fff" stroke="#D8DFEA" />
          <text x="540" y="80" textAnchor="middle" fill="#001448" letterSpacing=".7">
            POLICY
          </text>
          <text x="540" y="96" textAnchor="middle" fontSize="8.5">
            export filter
          </text>
        </g>
        <g className={on("n-exira", "nd")} id="n-exira">
          <rect x="622" y="56" width="74" height="60" rx="3" fill="#06307C" />
          <text
            x="659"
            y="83"
            textAnchor="middle"
            fontSize="12"
            fontFamily="Instrument Sans, sans-serif"
            fill="#fff"
          >
            exira
          </text>
          <text x="659" y="99" textAnchor="middle" fontSize="7.5" fill="#9DB2D8">
            report only
          </text>
        </g>
        <g className={on("f-auth", "fl")} id="f-auth">
          <path d="M100 86 H130" stroke="#234D9E" fill="none" markerEnd="url(#ah)" />
        </g>
        <g className={on("f-mint", "fl")} id="f-mint">
          <path d="M232 86 H262" stroke="#234D9E" fill="none" markerEnd="url(#ah)" />
        </g>
        <g className={on("f-out", "fl")} id="f-out">
          <path d="M456 86 H486" stroke="#234D9E" fill="none" markerEnd="url(#ah)" />
        </g>
        <g className={on("f-del", "fl")} id="f-del">
          <path d="M588 86 H616" stroke="#234D9E" fill="none" markerEnd="url(#ah)" />
        </g>
        <g className={on("f-clone", "fl")} id="f-clone">
          <path d="M362 8 V16" stroke="#234D9E" fill="none" markerEnd="url(#ah)" />
          <text x="372" y="12" fontSize="8" fill="#5D7092">
            clone · TLS · direct from provider
          </text>
        </g>
        <g className={on("f-block", "fl")} id="f-block">
          <path d="M622 136 H460" stroke="#8D9BB4" strokeDasharray="4 4" fill="none" />
          <g transform="translate(541 136)">
            <circle r="7.5" fill="#FAFCFF" stroke="#8D9BB4" />
            <path d="M-3 -3 3 3M3 -3-3 3" stroke="#8D9BB4" strokeWidth="1.3" />
          </g>
          <text x="541" y="156" textAnchor="middle" fontSize="8" fill="#8D9BB4">
            no inbound path
          </text>
        </g>
      </g>
    </svg>
  );
}
