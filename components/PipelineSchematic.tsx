import type { SchemaId } from "@/lib/isolation";

/* Section 02's schematic.

   Three things were wrong with the last version.

   The boundary was drawn as two dashed stubs that stopped in mid air, so
   it read as an unfinished line rather than a wall. It is one full-height
   rule now, terminated at both ends the way the hero's dimension line is,
   and the export policy sits on top of it. The policy box is the only
   thing that interrupts it, which is the entire claim.

   The descriptive labels lived inside the flow groups, which dim to a
   quarter opacity whenever their stage is not the active one, so two
   captions were unreadable at every stage including their own. Structural
   text is outside the dimming system now: nodes and captions stay legible
   throughout and only the arrows change weight.

   The mark in the middle was three diamonds drawn by hand, which is not
   the Exira icon. It is the real sprite symbol.

   Which parts are lit is derived from the active stage rather than
   toggled by hand, so the two cannot drift apart. */

export function PipelineSchematic({ step, hot }: { step: number; hot: readonly SchemaId[] }) {
  const on = (id: SchemaId, base: "nd" | "fl" | "bd") => (hot.includes(id) ? `${base} hot` : base);

  return (
    <svg
      id="schema"
      data-step={step}
      viewBox="0 0 700 212"
      role="img"
      aria-label="Schematic: the target authorises a sealed environment on its own side of a trust boundary. Findings cross the boundary through an export policy to Exira. There is no path back across."
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
        <marker
          id="ahBlocked"
          viewBox="0 0 8 8"
          refX="6.4"
          refY="4"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0 .6 7 4 0 7.4Z" fill="#8D9BB4" />
        </marker>
      </defs>

      <g fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#5D7092">
        {/* Structural text: never dimmed, because a caption you cannot read
            at any stage is worse than no caption. */}
        <text x="6" y="13" fontSize="8" letterSpacing="1.1" fill="#8D9BB4">
          TARGET SIDE
        </text>
        <text x="694" y="13" fontSize="8" letterSpacing="1.1" fill="#8D9BB4" textAnchor="end">
          EXIRA SIDE
        </text>
        <text x="313" y="16" fontSize="8" fill="#8D9BB4">
          direct from the provider
        </text>
        <text x="560" y="204" textAnchor="middle" fontSize="8" fill="#8D9BB4">
          no path back across
        </text>

        {/* Two segments butting against the policy box rather than one line
            behind it: the box carries group opacity, so a translucent fill
            would let the rule show straight through it. Outer ends are
            ticked, so neither segment reads as trailing off. */}
        <g className={on("n-boundary", "bd")} id="n-boundary">
          <path d="M504 24 V68M504 132 V196" stroke="#234D9E" strokeDasharray="3 5" fill="none" />
          <path d="M498 24 H510M498 196 H510" stroke="#234D9E" fill="none" />
        </g>

        <g className={on("f-auth", "fl")} id="f-auth">
          <path d="M120 100 H174" stroke="#234D9E" fill="none" markerEnd="url(#ah)" />
        </g>
        <g className={on("f-out", "fl")} id="f-out">
          <path d="M426 100 H448" stroke="#234D9E" fill="none" markerEnd="url(#ah)" />
        </g>
        <g className={on("f-del", "fl")} id="f-del">
          <path d="M558 100 H596" stroke="#234D9E" fill="none" markerEnd="url(#ah)" />
        </g>
        <g className={on("f-clone", "fl")} id="f-clone">
          <path d="M301 8 V28" stroke="#234D9E" fill="none" markerEnd="url(#ah)" />
        </g>

        {/* An arrow that is stopped, rather than a line that stops. */}
        <g className={on("f-block", "fl")} id="f-block">
          <path
            d="M600 184 H520"
            stroke="#8D9BB4"
            strokeDasharray="4 4"
            fill="none"
            markerEnd="url(#ahBlocked)"
          />
        </g>

        <g className={on("n-target", "nd")} id="n-target">
          <rect x="6" y="68" width="112" height="64" rx="3" fill="#FCFDFF" stroke="#D8DFEA" />
          <text x="62" y="94" textAnchor="middle" fill="#001448" letterSpacing=".7">
            TARGET
          </text>
          <text x="62" y="111" textAnchor="middle" fontSize="8.5">
            defines scope
          </text>
        </g>

        <g className={on("n-sealed", "nd")} id="n-sealed">
          <rect
            x="178"
            y="32"
            width="246"
            height="136"
            rx="4"
            fill="rgba(35,77,158,.05)"
            stroke="#234D9E"
            strokeDasharray="5 4"
          />
          <text x="301" y="52" textAnchor="middle" fill="#234D9E" fontSize="9.5" letterSpacing="1.1">
            SEALED ENVIRONMENT
          </text>
          <use href="#sym-icon" x="257" y="66" width="88" height="83" />
          <text x="301" y="161" textAnchor="middle" fontSize="8.5">
            eleven modules · critic pass
          </text>
        </g>

        <g className={on("n-policy", "nd")} id="n-policy">
          <rect x="452" y="68" width="104" height="64" rx="3" fill="#FCFDFF" stroke="#234D9E" />
          <text x="504" y="94" textAnchor="middle" fill="#001448" letterSpacing=".7">
            POLICY
          </text>
          <text x="504" y="111" textAnchor="middle" fontSize="8.5">
            the only opening
          </text>
        </g>

        <g className={on("n-exira", "nd")} id="n-exira">
          <rect x="600" y="68" width="94" height="64" rx="3" fill="#06307C" />
          <text
            x="647"
            y="95"
            textAnchor="middle"
            fontSize="12"
            fontFamily="Instrument Sans, sans-serif"
            fill="#fff"
          >
            exira
          </text>
          <text x="647" y="112" textAnchor="middle" fontSize="7.5" fill="#9DB2D8">
            report only
          </text>
        </g>

        {/* The stop itself, drawn last so it sits over the boundary. */}
        <g className={on("f-block", "fl")}>
          <g transform="translate(504 184)">
            <circle r="7.5" fill="#FCFDFF" stroke="#8D9BB4" />
            <path d="M-3 -3 3 3M3 -3-3 3" stroke="#8D9BB4" strokeWidth="1.3" />
          </g>
        </g>
      </g>
    </svg>
  );
}
