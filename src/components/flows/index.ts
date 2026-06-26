import { html } from "lit";
import { NewDur } from "@/type";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { IndividualObject } from "@/states/raw/individual/get-individual-object";
import { flowSolarToHome } from "./solar-to-home";
import { flowSolarToGrid } from "./solar-to-grid";
import { flowSolarToBattery } from "./solart-to-battery";
import { flowGridToHome } from "./grid-to-home";
import { flowBatteryToHome } from "./battery-to-home";
import { flowBatteryToGrid } from "./battery-to-grid";
import { flowEVToGrid } from "./ev-to-grid";
import { flowEVToBattery } from "./ev-to-battery";

export interface Flows {
  battery: any;
  grid: any;
  individual: IndividualObject[];
  solar: any;
  newDur: NewDur;
  evHomeColor?: string;
}

export const flowElement = (config: PowerFlowCardPlusConfig, { battery, grid, individual, solar, newDur, evHomeColor }: Flows) => {
  return html`
  ${flowSolarToHome(config, { battery, grid, individual, solar, newDur })}
  ${flowSolarToGrid(config, { battery, grid, individual, solar, newDur })}
  ${flowSolarToBattery(config, { battery, individual, solar, newDur })}
  ${flowGridToHome(config, { battery, grid, individual, solar, newDur })}
  ${flowBatteryToHome(config, { battery, grid, individual, newDur })}
  ${flowBatteryToGrid(config, { battery, grid, individual, newDur })}
  ${flowEVToGrid(config, { battery, grid, individual, solar, newDur, evHomeColor })}
  ${flowEVToBattery(config, { battery, grid, individual, solar, newDur, evHomeColor })}
</div>`;
};
