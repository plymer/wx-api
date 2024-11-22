export type LayerProperties = {
  name: string | null;
  dimension: string | null;
  type: string;
  domain: string;
  // storing all times as UTC date-time strings
  startTime?: string;
  endTime?: string;
  timeSteps?: string[];
};
