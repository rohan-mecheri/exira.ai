import type { SchemaId } from "@/lib/isolation";

/* Section 02's schematic.

   Four things were wrong with the last version.

   It labelled the left and right of the frame "TARGET SIDE" and "EXIRA
   SIDE", which is what the boxes already say. A label that repeats the
   thing it points at is decoration.

   The clone arrow came in from above the frame with a caption attached to
   nothing, so it read as a line trailing off the edge. Its origin is a
   real node now: the target's own provider, sitting alongside the target
   in the left column, with both feeding the environment.

   The divider is gone. Splitting it around the export policy left two
   stubs projecting from the box into whitespace, which is exactly the
   dangling line it was meant to replace.

   Removing it stranded the stopped arrow, which had been terminating on
   the divider and afterwards terminated on nothing. The return path is an
   ordinary edge between two ordinary nodes now, exira back to the export
   policy, routed clear of both boxes and cut on its own run. Two edges
   between the same pair of boxes, one live and one severed, is the
   shortest way to say the only opening is one-way, and neither end of it
   floats.

   Connectors are orthogonal and boxes share one height and one stroke, so
   the diagram reads as an architecture drawing rather than an
   illustration.

   Which parts are lit is derived from the active stage rather than
   toggled by hand, so the two cannot drift apart. */

export function PipelineSchematic({ step, hot }: { step: number; hot: readonly SchemaId[] }) {
  const on = (id: SchemaId, base: "nd" | "fl") => (hot.includes(id) ? `${base} hot` : base);

  return (
    <svg
      id="schema"
      data-step={step}
      viewBox="0 0 700 200"
      role="img"
      aria-label="Schematic: the target's repository provider and the target itself both feed a sealed environment. Findings cross a boundary through an export policy to Exira. There is no return path."
    >
      <defs>
        <marker
          id="ah"
          viewBox="0 0 8 8"
          refX="6.6"
          refY="4"
          markerWidth="5.5"
          markerHeight="5.5"
          orient="auto"
        >
          <path d="M0 .8 7 4 0 7.2Z" fill="#234D9E" />
        </marker>
        <marker
          id="ahStopped"
          viewBox="0 0 8 8"
          refX="6.6"
          refY="4"
          markerWidth="5.5"
          markerHeight="5.5"
          orient="auto"
        >
          <path d="M0 .8 7 4 0 7.2Z" fill="#8D9BB4" />
        </marker>
      </defs>

      <g fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#5D7092">
        <g className={on("f-clone", "fl")} id="f-clone">
          <path d="M118 46 H152" stroke="#234D9E" fill="none" markerEnd="url(#ah)" />
        </g>
        <g className={on("f-auth", "fl")} id="f-auth">
          <path d="M118 146 H152" stroke="#234D9E" fill="none" markerEnd="url(#ah)" />
        </g>
        <g className={on("f-out", "fl")} id="f-out">
          <path d="M404 96 H434" stroke="#234D9E" fill="none" markerEnd="url(#ah)" />
        </g>
        <g className={on("f-del", "fl")} id="f-del">
          <path d="M544 86 H600" stroke="#234D9E" fill="none" markerEnd="url(#ah)" />
        </g>

        {/* The return edge, drawn so it can be shown cut. */}
        <g className={on("f-block", "fl")} id="f-block">
          <path
            d="M650 124 V150 H500 V126"
            stroke="#8D9BB4"
            strokeDasharray="4 4"
            fill="none"
            markerEnd="url(#ahStopped)"
          />
        </g>
        <text x="575" y="170" textAnchor="middle" fontSize="8" fill="#8D9BB4">
          no return path
        </text>

        <g className={on("n-repo", "nd")} id="n-repo">
          <rect x="6" y="18" width="112" height="56" rx="3" fill="#FCFDFF" stroke="#D8DFEA" />
          <text x="62" y="44" textAnchor="middle" fill="#001448" letterSpacing=".7">
            REPOSITORY
          </text>
          <text x="62" y="60" textAnchor="middle" fontSize="8.5">
            target&apos;s provider
          </text>
        </g>

        <g className={on("n-target", "nd")} id="n-target">
          <rect x="6" y="118" width="112" height="56" rx="3" fill="#FCFDFF" stroke="#D8DFEA" />
          <text x="62" y="144" textAnchor="middle" fill="#001448" letterSpacing=".7">
            TARGET
          </text>
          <text x="62" y="160" textAnchor="middle" fontSize="8.5">
            issues the key
          </text>
        </g>

        <g className={on("n-sealed", "nd")} id="n-sealed">
          <rect
            x="158"
            y="18"
            width="246"
            height="156"
            rx="4"
            fill="rgba(35,77,158,.045)"
            stroke="#234D9E"
            strokeDasharray="5 4"
          />
          <text x="281" y="40" textAnchor="middle" fill="#234D9E" fontSize="9.5" letterSpacing="1.1">
            SEALED ENVIRONMENT
          </text>
          <use href="#sym-icon" x="237" y="54" width="88" height="83" />
          <text x="281" y="158" textAnchor="middle" fontSize="8.5">
            eleven modules · critic pass
          </text>
        </g>

        <g className={on("n-policy", "nd")} id="n-policy">
          <rect x="440" y="68" width="104" height="56" rx="3" fill="#FCFDFF" stroke="#234D9E" />
          <text x="492" y="94" textAnchor="middle" fill="#001448" letterSpacing=".7">
            POLICY
          </text>
          <text x="492" y="110" textAnchor="middle" fontSize="8.5">
            the only opening
          </text>
        </g>

        <g className={on("n-exira", "nd")} id="n-exira">
          <rect x="606" y="68" width="88" height="56" rx="3" fill="#06307C" />
          <text
            x="650"
            y="95"
            textAnchor="middle"
            fontSize="12"
            fontFamily="Instrument Sans, sans-serif"
            fill="#fff"
          >
            exira
          </text>
          <text x="650" y="111" textAnchor="middle" fontSize="7.5" fill="#9DB2D8">
            report only
          </text>
        </g>

        {/* The cut, sitting on the policy's own border. Drawn last so it
            reads as severing the edge rather than decorating it. */}
        <g className={on("f-block", "fl")}>
          <g transform="translate(575 150)">
            <circle r="7" fill="#FCFDFF" stroke="#8D9BB4" />
            <path d="M-2.8 -2.8 2.8 2.8M2.8 -2.8-2.8 2.8" stroke="#8D9BB4" strokeWidth="1.3" />
          </g>
        </g>
      </g>
    </svg>
  );
}
