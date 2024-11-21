import { Request, Response } from "express";
import { DOMParser } from "@xmldom/xmldom";
import axios from "axios";
import { coordinateTimes } from "../lib/utils";
import { LayerProperties } from "../lib/generic-types";

interface GeoMetLayer {
  layers: string;
  coordinate?: boolean;
}

export const GEOMET_GETCAPABILITIES: string =
  "https://geo.weather.gc.ca/geomet/?lang=en&service=WMS&request=GetCapabilities&version=1.3.0&LAYERS_REFRESH_RATE=PT1M";

export const layerParams = async (req: Request<{}, {}, {}, GeoMetLayer>, res: Response) => {
  try {
    const parser = new DOMParser();

    const { layers, coordinate } = req.query;

    if (!layers) {
      res.status(400).json({ status: "error", message: "No layers were requested" });
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
            }
          : ""
      )
      .filter((v) => v !== "") as LayerProperties[];

    // give the option to search all possible layers with a search param of 'layers=all'\
    // otherwise, return the requested layer details
    let output =
      layers === "all"
        ? capabilities
        : (searches.map((layer) => capabilities.find((c) => c.name === layer)) as LayerProperties[]);

    // if we have chosen to coordinate all of the layer times, do that now
    output = coordinate ? coordinateTimes(output.map((l) => l)) : output;

    res.status(200).json({ status: "success", layers: output });
  } catch (error) {
    res.status(400).json({ status: "error", message: error });
  }
};
