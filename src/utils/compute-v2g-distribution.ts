import { IndividualObject } from "@/states/raw/individual/get-individual-object";

type GridLike = { state: { toGrid: number | null } };
type SolarLike = { state: { toGrid: number | null } };
type BatteryLike = { state: { toGrid: number | null } };

export type V2GDistribution = {
  /** Total power (W) all bidirectional devices feed into the home. */
  evToHomeTotal: number;
  /** Total power (W) all bidirectional devices export to the grid. */
  evToGridTotal: number;
};

/**
 * Distributes the output of bidirectional individual devices (e.g. a V2G EV) across
 * the home and the grid, mirroring how the battery is treated as a source.
 *
 * A bidirectional device with a negative signed reading is *exporting*: it powers the
 * home first, and any surplus that the measured grid export can't be attributed to
 * solar or battery is shown as flowing from the device to the grid.
 *
 * Mutates each exporting device's `toHome` / `toGrid` fields and returns the totals so
 * the caller can fold them into the home-consumption ring.
 */
export function computeV2GDistribution(params: {
  individualObjs: IndividualObject[];
  grid: GridLike;
  solar: SolarLike;
  battery: BatteryLike;
}): V2GDistribution {
  const { individualObjs, grid, solar, battery } = params;

  // Grid export that hasn't already been attributed to solar or the battery is the
  // portion we can credit to the EV.
  let remainingExport = Math.max(0, (grid.state.toGrid ?? 0) - (solar.state.toGrid ?? 0) - (battery.state.toGrid ?? 0));

  let evToHomeTotal = 0;
  let evToGridTotal = 0;

  for (const individual of individualObjs) {
    individual.toHome = 0;
    individual.toGrid = 0;

    if (!individual.isBidirectional || individual.stateRaw === null || individual.stateRaw >= 0) continue;

    const evSource = -individual.stateRaw; // watts being exported by this device
    const toGrid = Math.min(evSource, remainingExport);
    remainingExport -= toGrid;
    const toHome = Math.max(0, evSource - toGrid);

    individual.toGrid = toGrid;
    individual.toHome = toHome;
    evToHomeTotal += toHome;
    evToGridTotal += toGrid;
  }

  return { evToHomeTotal, evToGridTotal };
}
