import { LayerProperties } from "./generic-types";

export const FEET_PER_METRE = 3.28084;

export function leadZero(input: number): string {
  const inputString: string = input.toString();
  return inputString.length < 2 ? "0" + inputString : inputString;
}

type TempLayer = {
  name: string;
  dimensionString: string;
  start: number;
  startString?: string;
  end: number;
  endString?: string;
  delta: number;
  deltaString?: string;
  duration: number;
};

export function coordinateTimes(layers: LayerProperties[]) {
  // this will hold our temp data for our 'race'
  var temp: TempLayer[] = [];

  var output: LayerProperties[] = [];

  // we are making an arbitrary decision of how many frames we want in the animation
  const NUM_OF_FRAMES = 24;

  // loop over all the layers passed to us to generate our temp data
  layers.forEach((l, i) => {
    const timeArray = l.dimension!.split("/");

    const startTime = Date.parse(timeArray[0]);
    const endTime = Date.parse(timeArray[1]);
    const delta = parseInt(timeArray[2].replace(/[a-zA-Z]/g, "")) * 60 * 1000;
    const duration = endTime - startTime > 3 * 60 * 60 * 1000 ? 3 * 60 * 60 * 1000 : endTime - startTime;

    temp[i] = {
      name: l.name!,
      start: startTime,
      end: endTime,
      delta: delta,
      duration: duration / (60 * 60 * 1000),
      dimensionString: l.dimension!,
    };
  });

  let t = 0; // start the 'competition' from unix epoch time zero
  let winner = ""; // the layer that has the newest end time available
  let winnerDelta = 0;
  let losers: string[] = []; // the layers that will have (potentially) duplicated time steps and the end of their run to sync with the winner

  temp.forEach((l) => {
    if (l.end > t) {
      t = l.end;
      winner = l.name;
      winnerDelta = l.delta;
    } else {
      losers.push(l.name);
    }
  });

  // let's start from our end time

  temp.forEach((layer) => {
    const endDiff = layer.end - t;
    var layerTimeRemaining: number = layer.end;
    var winnerTimeRemaining: number = t;

    // console.log(
    //   "winner time:",
    //   new Date(t),
    //   "| layer time:",
    //   new Date(layer.end),
    //   "| layer name:",
    //   layer.name,
    //   "| winner-layer difference (min):",
    //   endDiff / (60 * 1000),
    //   "| layer delta (min):",
    //   layer.delta / (60 * 1000)
    // );

    let layerFrameTimes: string[] = [];
    let frameCaughtUp: number = 9999;

    for (let i = 0; i < NUM_OF_FRAMES; i++) {
      // console.log(frameCaughtUp);
      winnerTimeRemaining = i === 0 ? winnerTimeRemaining : winnerTimeRemaining - winnerDelta;
      // console.log(new Date(winnerTimeRemaining));

      if (frameCaughtUp === 9999 && winnerTimeRemaining <= layerTimeRemaining) {
        frameCaughtUp = i;
      } else if (
        winnerTimeRemaining > layerTimeRemaining + layer.delta / 2 ||
        winnerTimeRemaining <= layerTimeRemaining - layer.delta / 2
      ) {
        frameCaughtUp = 9999;
      }

      // console.log(new Date(layerTimeRemaining), new Date(winnerTimeRemaining), frameCaughtUp);

      layerTimeRemaining =
        layerTimeRemaining <= winnerTimeRemaining && frameCaughtUp >= i
          ? layerTimeRemaining
          : layerTimeRemaining - layer.delta;

      layerFrameTimes.push(makeISOTimeStamp(layerTimeRemaining));
    }

    output.push({ name: layer.name, dimension: layer.dimensionString, timeSteps: layerFrameTimes.reverse() });
  });

  return output;
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
