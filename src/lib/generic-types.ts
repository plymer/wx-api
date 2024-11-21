export type LayerProperties = {
  name: string | null;
  dimension: string | null;
  // storing all times as UTC date-time strings
  startTime?: string;
  endTime?: string;
  timeSteps?: string[];
};
