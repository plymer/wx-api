export type LayerProperties = {
  name: string | null;
  dimension?: string | null;
  type: string;
  domain: string;
  deltaTime?: number;
  // storing all times as UTC date-time strings
  startTime?: string;
  endTime?: string;
  timeSteps?: string[];
};
