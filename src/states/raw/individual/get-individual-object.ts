import { ActionConfig, HomeAssistant } from "custom-card-helpers";
import { IndividualDeviceType } from "@/type";
import { computeFieldIcon, computeFieldName } from "@/utils/compute-field-attributes";
import { getIndividualSecondaryState, getIndividualState, getIndividualStateRaw } from ".";
import { hasIndividualObject } from "./has-individual-object";
import { convertColorListToHex } from "@/utils/convert-color";

const fallbackIndividualObject: IndividualObject = {
  field: undefined,
  entity: "",
  has: false,
  state: null,
  displayZero: false,
  displayZeroTolerance: 0,
  icon: "",
  name: "",
  color: null,
  unit: undefined,
  unit_white_space: false,
  invertAnimation: false,
  showDirection: false,
  isBidirectional: false,
  stateRaw: null,
  toHome: 0,
  toGrid: 0,
  toBattery: 0,
  secondary: {
    entity: null,
    template: null,
    has: false,
    state: null,
    icon: null,
    unit: null,
    unit_white_space: false,
    displayZero: false,
    accept_negative: false,
    displayZeroTolerance: 0,
    decimals: null,
  },
};

export type IndividualObject = {
  field: IndividualDeviceType | undefined;
  entity: string;
  has: boolean;
  state: number | null;
  displayZero: boolean;
  displayZeroTolerance: number;
  icon: string;
  name: string;
  color: any;
  unit?: string;
  unit_white_space: boolean;
  decimals?: number;
  invertAnimation: boolean;
  showDirection: boolean;
  /** True when configured as a bidirectional source (e.g. V2G EV). */
  isBidirectional: boolean;
  /** Signed power in watts: positive = consumption, negative = production (V2G). */
  stateRaw: number | null;
  /** Power (W) this device feeds into the home. Only set for bidirectional devices that are exporting. */
  toHome: number;
  /** Power (W) this device exports to the grid. Only set for bidirectional devices that are exporting. */
  toGrid: number;
  /** Power (W) this device uses to charge the house battery. Only set for bidirectional devices that are exporting. */
  toBattery: number;
  secondary: {
    entity: string | null;
    template: string | null;
    has: boolean;
    state: string | number | null;
    icon: string | null;
    unit: string | null;
    unit_white_space: boolean;
    displayZero: boolean;
    accept_negative: boolean;
    displayZeroTolerance: number;
    decimals: number | null;
    tap_action?: ActionConfig;
    hold_action?: ActionConfig;
    double_tap_action?: ActionConfig;
  };
};

export const getIndividualObject = (hass: HomeAssistant, field: IndividualDeviceType | undefined): IndividualObject => {
  if (!field || !field?.entity) return fallbackIndividualObject;
  const entity = field.entity;
  const state = getIndividualState(hass, field);
  const stateRaw = getIndividualStateRaw(hass, field);
  const isBidirectional = field?.bidirectional || false;
  const displayZero = field?.display_zero || false;
  const displayZeroTolerance = field?.display_zero_tolerance || 0;
  const has = hasIndividualObject(displayZero, state, displayZeroTolerance);
  // For a bidirectional device, a negative (signed) reading means the device is
  // exporting power. We flip the animation/arrow so the flow points *toward* the
  // home instead of toward the device.
  const isStateNegative = isBidirectional && stateRaw !== null && stateRaw < 0;
  const userConfiguredInvertAnimation = field?.inverted_animation || false;
  const invertAnimation = isStateNegative ? !userConfiguredInvertAnimation : userConfiguredInvertAnimation;

  let color: string | null = null;
  if (field?.color && typeof field?.color === "string") {
    color = field.color;
  } else if (field?.color && typeof field?.color === "object") {
    color = convertColorListToHex(field.color);
  }

  return {
    field,
    entity,
    has,
    state,
    displayZero,
    displayZeroTolerance,
    icon: computeFieldIcon(hass, field, "mdi:flash"),
    name: computeFieldName(hass, field, "Individual"),
    color,
    unit: field?.unit_of_measurement,
    unit_white_space: field?.unit_white_space !== false,
    decimals: field?.decimals,
    invertAnimation,
    showDirection: field?.show_direction || false,
    isBidirectional,
    stateRaw,
    toHome: 0,
    toGrid: 0,
    toBattery: 0,
    secondary: {
      entity: field?.secondary_info?.entity || null,
      template: field?.secondary_info?.template || null,
      has: field?.secondary_info?.entity !== undefined,
      state: getIndividualSecondaryState(hass, field) || null,
      accept_negative: field?.secondary_info?.accept_negative || false,
      icon: field?.secondary_info?.icon || null,
      unit: field?.secondary_info?.unit_of_measurement || null,
      unit_white_space: field?.secondary_info?.unit_white_space !== false,
      displayZero: field?.secondary_info?.display_zero || false,
      displayZeroTolerance: field?.secondary_info?.display_zero_tolerance || 0,
      decimals: field?.secondary_info?.decimals || null,
      tap_action: field?.secondary_info?.tap_action,
      hold_action: field?.secondary_info?.hold_action,
      double_tap_action: field?.secondary_info?.double_tap_action,
    },
  };
};
