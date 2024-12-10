import { LayerProperties } from "./generic-types";

export const FEET_PER_METRE = 3.28084;

export function leadZero(input: number): string {
  const inputString: string = input.toString();
  return inputString.length < 2 ? "0" + inputString : inputString;
}

type TempLayer = Omit<LayerProperties, "Dimension"> & {
  start?: number;
  startString?: string;
  end?: number;
  endString?: string;
  delta?: number;
  deltaString?: string;
  duration?: number;
};

export function coordinateTimes(layers: LayerProperties[], numOfFrames: number, mode: "loop" | undefined) {
  // this will hold our temp data for our 'race'
  var temp: TempLayer[] = [];

  var output: LayerProperties[] = [];

  // loop over all the layers passed to us to generate our temp data
  layers.forEach((l, i) => {
    const timeArray = l.dimension!.split("/");

    const startTime = Date.parse(timeArray[0]);
    const endTime = Date.parse(timeArray[1]);
    const delta = parseInt(timeArray[2].replace(/[a-zA-Z]/g, "")) * 60 * 1000;
    const duration = endTime - startTime > 3 * 60 * 60 * 1000 ? 3 * 60 * 60 * 1000 : endTime - startTime;

    temp[i] = {
      ...l,

      start: startTime,
      end: endTime,
      delta: delta,
      duration: duration / (60 * 60 * 1000),
    };
  });

  // of the layers selected, this is the largest delta (timestep) and we will use this to drive our animation
  // we may move this logic to the client as a parameter that can be selected
  let largestDelta = 0;

  // find the largest time delta
  temp.forEach((l) => {
    if (l.delta! > largestDelta) {
      largestDelta = l.delta!;
    }
  });

  // set the start time and then iterate backwards from there to generate the realTimeArray
  // realTimeArray will contain timesteps that will be used to find the 'best data' to display at that time

  const currentTime = new Date();
  const deltaMinutes = largestDelta / 60000;
  const deltaModulo = currentTime.getUTCMinutes() % deltaMinutes;

  const realStartTime =
    mode === "loop"
      ? Date.UTC(
          currentTime.getUTCFullYear(),
          currentTime.getUTCMonth(),
          currentTime.getUTCDate(),
          currentTime.getUTCHours(),
          currentTime.getUTCMinutes() - deltaModulo
        )
      : Date.UTC(
          currentTime.getUTCFullYear(),
          currentTime.getUTCMonth(),
          currentTime.getUTCDate(),
          currentTime.getUTCHours(),
          currentTime.getUTCMinutes()
        );

  // initialize and populate our array that tracks what our timesteps are
  let realTimeArray: number[] = [];
  for (let i = 0; i < numOfFrames; i++) {
    realTimeArray.push(realStartTime - i * largestDelta);
  }

  // loop through all of our layers and generate valid timesteps for each,
  //   using our temporary layer objects
  temp.forEach((layer) => {
    // store our valid UTC timestamps that we calculate
    let layerFrameTimes: string[] = [];
    // initialize some offsets for our for-loop
    let frameOffset = 0;
    let syncOffset = 0;

    for (let i = 0; i < numOfFrames; i++) {
      if (mode === "loop") {
        // calculate the current time for the layer based on
        //  a) its end time defined in geomet
        //  b) its frameOffset depending on how many frames ahead of the main timestep it is
        //  c) its syncOffset depending on if we need to 'hold' frames in the animation
        //  d) its internal timestep
        let currentLayerTime = layer.end! - (i + frameOffset - syncOffset) * layer.delta!;

        // add a frame offset to allow us to skip frames that don't change at the same
        //   rate that the main timestep does
        while (currentLayerTime > realTimeArray[i]) {
          frameOffset++;
          currentLayerTime = layer.end! - (i + frameOffset) * layer.delta!;
        }

        // if our layer is behind the main time defined in the realTimeArray,
        //   and we haven't had to add any frame offsets because our data doesn't
        //   have a different time step, we need to sync up with the main flow
        //   of time, so add a time offset to catch up
        if (currentLayerTime < realTimeArray[i] && frameOffset === 0) {
          syncOffset++;
        }

        // push our calculated timestep to the output for the layer
        layerFrameTimes.push(makeISOTimeStamp(currentLayerTime));
      } else {
        layerFrameTimes.push(makeISOTimeStamp(layer.end!));
      }
    }

    // delete layer.start;
    // delete layer.end;
    // delete layer.delta;
    delete layer.duration;
    delete layer.dimension;

    // we want to make sure that the layerFrameTimes here are 'reversed' such that the array
    //   of timesteps has the oldest times at the zeroth index
    output.push({ ...layer, timeSteps: layerFrameTimes.reverse() });
  });

  return { timesAvailable: realTimeArray.map((rt) => makeISOTimeStamp(rt)).reverse(), layers: output };
}

export function makeISOTimeStamp(time: number, mode: "display" | "data" = "data") {
  return mode === "display"
    ? new Date(time)
        .toISOString() // convert the unix epoch time into an ISO date string
        .replace(/:\d+.\d+Z$/g, "Z") // remove the seconds and milliseconds
        .replace("T", " ") // replace the "T" with a space
    : new Date(time)
        .toISOString() // convert the unix epoch time into an ISO date string
        .replace(/.\d+Z$/g, "Z"); // remove the milliseconds
}
