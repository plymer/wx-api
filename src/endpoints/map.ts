import { Request, Response } from "express";
import { DOMParser, LiveNodeList } from "@xmldom/xmldom";
import axios from "axios";
import { coordinateTimes } from "../lib/utils";
import { LayerProperties } from "../lib/generic-types";

interface GeoMetLayer {
  layers: string;
  mode: "loop" | undefined;
  frames: number;
}

export const GEOMET_GETCAPABILITIES: string =
  "https://geo.weather.gc.ca/geomet/?lang=en&service=WMS&request=GetCapabilities&version=1.3.0&LAYERS_REFRESH_RATE=PT1M";

const getTypes = (keywords: LiveNodeList) => {
  const results = [...keywords].map((kw) => [...kw.childNodes].map((cn) => cn.nodeValue).toString());

  return results.filter((kw) => kw === "Satellite images" || kw === "Radar").toString();
};

export const layerParams = async (req: Request<{}, {}, {}, GeoMetLayer>, res: Response) => {
  try {
    const parser = new DOMParser();

    const { layers, mode, frames } = req.query;

    if (!layers) {
      res.status(400).json({ status: "error", message: "No layers were requested" });
      return;
    }

    if (layers !== "all" && !frames) {
      res.status(400).json({ status: "error", message: "Number of frames was not specified" });
      return;
    }

    // parse the layers requested into separate strings
    const searches = layers.split(",");

    const xml = await axios.get(GEOMET_GETCAPABILITIES).then((response) => response.data);

    const options = parser
      .parseFromString(xml, "application/xml")
      .getElementsByTagName("Capability")[0]
      .getElementsByTagName("Layer");

    const capabilities = [...options]
      .map((l, i) =>
        l.getAttribute("opaque") && l.hasChildNodes() && l.getElementsByTagName("Dimension")
          ? {
              name: l.getElementsByTagName("Name")[0].childNodes[0].nodeValue,
              dimension: l.getElementsByTagName("Dimension")[0].childNodes[0].nodeValue,
              domain:
                l.parentElement?.getElementsByTagName("Name")[0].childNodes[0].nodeValue?.toLowerCase() ===
                  "north american radar composite [1 km]" ||
                l.parentElement?.getElementsByTagName("Name")[0].childNodes[0].nodeValue?.toLowerCase() ===
                  "north american radar surface precipitation type [1 km]"
                  ? "national"
                  : l.parentElement?.getElementsByTagName("Name")[0].childNodes[0].nodeValue?.toLowerCase(),
              type: getTypes(l.getElementsByTagName("Keyword")) === "Satellite images" ? "satellite" : "radar",
            }
          : ""
      )
      .filter((v) => v !== "") as LayerProperties[];

    // console.log(capabilities);

    // give the option to search all possible layers with a search param of 'layers=all'
    // otherwise, return the requested layer details
    let output: LayerProperties[] =
      layers === "all"
        ? capabilities
        : (searches.map((layer) => capabilities.find((c) => c.name === layer)) as LayerProperties[]);

    // if we have chosen to coordinate all of the layer times, do that now
    let formattedOutput =
      layers !== "all"
        ? coordinateTimes(
            output.map((l) => l),
            frames,
            mode
          )
        : output;

    res.status(200).json({ status: "success", ...formattedOutput });
  } catch (error) {
    res.status(400).json({ status: "error", message: error });
  }
};
