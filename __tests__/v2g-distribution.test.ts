import { describe, expect, it } from "@jest/globals";
import { computeV2GDistribution } from "../src/utils/compute-v2g-distribution";
import { IndividualObject } from "../src/states/raw/individual/get-individual-object";

const makeIndividual = (overrides: Partial<IndividualObject>): IndividualObject =>
  ({
    field: undefined,
    entity: "sensor.ev",
    has: true,
    state: 0,
    displayZero: false,
    displayZeroTolerance: 0,
    icon: "",
    name: "EV",
    color: "#29b6f6",
    unit: undefined,
    unit_white_space: false,
    invertAnimation: false,
    showDirection: false,
    isBidirectional: false,
    stateRaw: null,
    toHome: 0,
    toGrid: 0,
    secondary: {} as IndividualObject["secondary"],
    ...overrides,
  }) as IndividualObject;

describe("computeV2GDistribution", () => {
  it("splits a V2G export between home and grid (live Sigenergy scenario)", () => {
    // EV exporting 9440 W, grid measured exporting 7894 W, solar/battery idle.
    const ev = makeIndividual({ isBidirectional: true, state: 9440, stateRaw: -9440 });
    const result = computeV2GDistribution({
      individualObjs: [ev],
      grid: { state: { toGrid: 7894 } },
      solar: { state: { toGrid: 0 } },
      battery: { state: { toGrid: 0 } },
    });

    expect(ev.toGrid).toBe(7894);
    expect(ev.toHome).toBe(9440 - 7894);
    expect(result.evToGridTotal).toBe(7894);
    expect(result.evToHomeTotal).toBe(1546);
  });

  it("treats a charging (positive) bidirectional device as a pure load", () => {
    const ev = makeIndividual({ isBidirectional: true, state: 8800, stateRaw: 8800 });
    const result = computeV2GDistribution({
      individualObjs: [ev],
      grid: { state: { toGrid: 0 } },
      solar: { state: { toGrid: 0 } },
      battery: { state: { toGrid: 0 } },
    });

    expect(ev.toHome).toBe(0);
    expect(ev.toGrid).toBe(0);
    expect(result.evToHomeTotal).toBe(0);
    expect(result.evToGridTotal).toBe(0);
  });

  it("does not credit grid export already attributed to solar/battery", () => {
    // Grid exports 5000 W but 5000 W is from solar -> EV should only feed home.
    const ev = makeIndividual({ isBidirectional: true, state: 2000, stateRaw: -2000 });
    computeV2GDistribution({
      individualObjs: [ev],
      grid: { state: { toGrid: 5000 } },
      solar: { state: { toGrid: 5000 } },
      battery: { state: { toGrid: 0 } },
    });

    expect(ev.toGrid).toBe(0);
    expect(ev.toHome).toBe(2000);
  });

  it("ignores non-bidirectional devices", () => {
    const load = makeIndividual({ isBidirectional: false, state: 1000, stateRaw: 1000 });
    const result = computeV2GDistribution({
      individualObjs: [load],
      grid: { state: { toGrid: 3000 } },
      solar: { state: { toGrid: 0 } },
      battery: { state: { toGrid: 0 } },
    });

    expect(load.toHome).toBe(0);
    expect(load.toGrid).toBe(0);
    expect(result.evToHomeTotal).toBe(0);
  });
});
