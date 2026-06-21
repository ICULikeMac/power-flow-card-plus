import { HomeAssistant } from "custom-card-helpers";
import { getEntityStateWatts } from "@/states/utils/get-entity-state-watts";
import { IndividualDeviceType } from "@/type";
import { isNumberValue } from "@/utils/utils";
import { getEntityStateObj } from "@/states/utils/get-entity-state-obj";

export const getIndividualState = (hass: HomeAssistant, field: IndividualDeviceType) => {
  const entity: string = field?.entity;

  if (entity === undefined) return null;

  const individualStateWatts = getEntityStateWatts(hass, entity);

  return Math.abs(individualStateWatts);
};

/**
 * Signed power for an individual device, in watts.
 * Positive = consumption (load / charging), negative = production (V2G / discharging).
 * Honours `invert_bidirectional` so sensors with the opposite sign convention work too.
 */
export const getIndividualStateRaw = (hass: HomeAssistant, field: IndividualDeviceType): number | null => {
  const entity: string = field?.entity;

  if (entity === undefined) return null;

  const individualStateWatts = getEntityStateWatts(hass, entity);

  return field?.invert_bidirectional ? -individualStateWatts : individualStateWatts;
};

export const getIndividualSecondaryState = (hass: HomeAssistant, field: IndividualDeviceType) => {
  if (typeof field?.entity !== "string") return null;

  const entityObj = getEntityStateObj(hass, field?.secondary_info?.entity);
  const secondaryState = entityObj?.state;

  if (isNumberValue(secondaryState)) return Number(secondaryState);

  return secondaryState;
};
