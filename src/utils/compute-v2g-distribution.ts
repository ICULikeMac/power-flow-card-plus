import { IndividualObject } from "@/states/raw/individual/get-individual-object";

type GridLike = { state: { toGrid: number | null; toBattery: number | null } };
type SolarLike = { state: { toGrid: number | null; toBattery: number | null } };
type BatteryLike = { state: { toGrid: number | null; toBattery: number | null } };

export type V2GDistribution = {
  /** Total power (W) all bidirectional devices feed into the home. */
  evToHomeTotal: number;
  /** Total power (W) all bidirectional devices export to the grid. */
  evToGridTotal: number;
  /** Total power (W) all bidirectional devices use to charge the house battery. */
  evToBatteryTotal: number;
};

/**
 * Distributes the output of bidirectional individual devices (e.g. a V2G EV) across
 * the house battery, the home and the grid, mirroring how the battery is treated as a
 * source.
 *
 * A bidirectional device with a negative signed reading is *exporting*. Its output is
 * allocated to the gaps the conventional solar/grid/battery solver could not explain:
 *   1. battery charge that solar and the grid did not supply,
 *   2. grid export that solar and the battery did not supply,
 *   3. the remainder feeds the home.
 *
 * Because the conventional solver already fully allocates solar/grid/battery, the three
 * gaps sum to the device's output (energy conservation), so the home remainder is exactly
 * the home consumption not already covered by another source.
 *
 * Mutates each exporting device's `toHome` / `toGrid` / `toBattery` fields and returns the
 * totals so the caller can fold them into the home-consumption ring and the flow lines.
 */
export function computeV2GDistribution(params: {
  individualObjs: IndividualObject[];
  grid: GridLike;
  solar: SolarLike;
  battery: BatteryLike;
}): V2GDistribution {
  const { individualObjs, grid, solar, battery } = params;

  // Grid export not already attributed to solar or the battery.
  let remainingExport = Math.max(0, (grid.state.toGrid ?? 0) - (solar.state.toGrid ?? 0) - (battery.state.toGrid ?? 0));
  // Battery charge not already attributed to solar or the grid.
  let remainingBatteryCharge = Math.max(0, (battery.state.toBattery ?? 0) - (solar.state.toBattery ?? 0) - (grid.state.toBattery ?? 0));

  let evToHomeTotal = 0;
  let evToGridTotal = 0;
  let evToBatteryTotal = 0;

  for (const individual of individualObjs) {
    individual.toHome = 0;
    individual.toGrid = 0;
    individual.toBattery = 0;

    if (!individual.isBidirectional || individual.stateRaw === null || individual.stateRaw >= 0) continue;

    let remaining = -individual.stateRaw; // watts being exported by this device

    // 1. Charge the house battery (the charge not already explained by solar/grid).
    const toBattery = Math.min(remaining, remainingBatteryCharge);
    remainingBatteryCharge -= toBattery;
    remaining -= toBattery;

    // 2. Export the surplus the grid is actually selling.
    const toGrid = Math.min(remaining, remainingExport);
    remainingExport -= toGrid;
    remaining -= toGrid;

    // 3. Whatever is left powers the home.
    const toHome = Math.max(0, remaining);

    individual.toBattery = toBattery;
    individual.toGrid = toGrid;
    individual.toHome = toHome;
    evToBatteryTotal += toBattery;
    evToGridTotal += toGrid;
    evToHomeTotal += toHome;
  }

  return { evToHomeTotal, evToGridTotal, evToBatteryTotal };
}
