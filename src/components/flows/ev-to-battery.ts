import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { showLine } from "@/utils/show-line";
import { html, svg, nothing } from "lit";
import { type Flows } from "./index";
import { checkHasBottomIndividual, checkHasRightIndividual } from "@/utils/compute-individual-position";
import { checkShouldShowDots } from "@/utils/check-should-show-dots";

/**
 * Charge of the house battery from a bidirectional individual device (V2G EV).
 *
 * When the car exports power that the solar/grid solver can't account for and the
 * battery is charging, that charge is coming from the car. We reuse the battery↔home
 * curve geometry but animate the dots *toward* the battery and recolour the line with
 * the EV's colour so it reads as EV → battery.
 */
export const flowEVToBattery = (config: PowerFlowCardPlusConfig, { battery, grid, individual, newDur, evHomeColor }: Flows) => {
  const evToBatteryTotal = individual.reduce((acc, i) => acc + (i?.toBattery || 0), 0);
  const shouldShow = battery.has && evToBatteryTotal > 0 && showLine(config, evToBatteryTotal) && !config.entities.home?.hide;
  if (!shouldShow) return nothing;

  return html`<div
    class="lines ${classMap({
      high: battery.has || checkHasBottomIndividual(individual),
      "individual1-individual2": !battery.has && individual.every((i) => i?.has),
      "multi-individual": checkHasRightIndividual(individual),
    })}"
  >
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="ev-battery-flow">
      <path
        id="ev-battery"
        class="ev-battery"
        style="stroke: ${evHomeColor};"
        d="M55,100 v-${grid.has ? 15 : 17} c0,-30 10,-30 30,-30 h20"
        vector-effect="non-scaling-stroke"
      ></path>
      ${checkShouldShowDots(config)
        ? svg`<circle r="1" class="ev-battery" style="fill: ${evHomeColor};" vector-effect="non-scaling-stroke">
            <animateMotion dur="${newDur.evToBattery}s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="paced">
              <mpath xlink:href="#ev-battery" />
            </animateMotion>
          </circle>`
        : nothing}
    </svg>
  </div>`;
};
