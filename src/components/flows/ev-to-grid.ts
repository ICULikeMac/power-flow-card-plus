import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { showLine } from "@/utils/show-line";
import { html, svg, nothing } from "lit";
import { type Flows } from "./index";
import { checkHasBottomIndividual, checkHasRightIndividual } from "@/utils/compute-individual-position";
import { checkShouldShowDots } from "@/utils/check-should-show-dots";

/**
 * Export from a bidirectional individual device (V2G EV) to the grid.
 *
 * The device feeds the home (rendered by its own EV→Home line) and the surplus
 * leaves through the home busbar to the grid. We reuse the horizontal grid line
 * geometry but animate the dots in the *export* direction (home → grid).
 */
export const flowEVToGrid = (config: PowerFlowCardPlusConfig, { battery, grid, individual, solar, newDur, evHomeColor }: Flows) => {
  const evToGridTotal = individual.reduce((acc, i) => acc + (i?.toGrid || 0), 0);
  const shouldShow = grid.has && grid.hasReturnToGrid && evToGridTotal > 0 && showLine(config, evToGridTotal);
  if (!shouldShow) return nothing;

  return html`<div
    class="lines ${classMap({
      high: battery.has || checkHasBottomIndividual(individual),
      "individual1-individual2": !battery.has && individual.every((i) => i?.has),
      "multi-individual": checkHasRightIndividual(individual),
    })}"
  >
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="ev-grid-flow" class="flat-line">
      <path
        id="ev-grid"
        class="ev-grid"
        style="stroke: ${evHomeColor};"
        d="M0,${battery.has ? 50 : solar.has ? 56 : 53} H100"
        vector-effect="non-scaling-stroke"
      ></path>
      ${checkShouldShowDots(config)
        ? svg`<circle r="1" class="ev-grid" style="fill: ${evHomeColor};" vector-effect="non-scaling-stroke">
            <animateMotion dur="${newDur.evToGrid}s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="paced">
              <mpath xlink:href="#ev-grid" />
            </animateMotion>
          </circle>`
        : nothing}
    </svg>
  </div>`;
};
