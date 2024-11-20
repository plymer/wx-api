import { Request, Response } from "express";
import { DOMParser } from "@xmldom/xmldom";
import axios from "axios";

interface GeoMetLayer {
  layers: string;
}

export const GEOMET_GETCAPABILITIES: string =
  "https://geo.weather.gc.ca/geomet/?lang=en&service=WMS&request=GetCapabilities&version=1.3.0&LAYERS_REFRESH_RATE=PT1M";

export const layerParams = async (req: Request<{}, {}, {}, GeoMetLayer>, res: Response) => {
  try {
    const parser = new DOMParser();

    let { layers } = req.query;

    if (!layers) {
      return res.status(400).json({ status: "error", message: "No layers were requested" });
    }

    // parse the layers requested into separate strings
    const searches = layers.split(",");

    const xml = await axios.get(GEOMET_GETCAPABILITIES).then((response) => response.data);

    searches.forEach((layer) => {
      const geometLayers = parser.parseFromString(xml, "text/xml").getElementsByTagName("Layer");

      //   console.log(geometLayers.length);

      [...geometLayers].map((l, i) =>
        [...l.childNodes].map((c, j) => (c.childNodes["childNodes"] !== null ? console.log(c.childNodes, j) : ""))
      );
    });

    const output = searches.map((s) => s);

    return res.status(200).json({ status: "success", layers: output });
  } catch (error) {
    return res.status(400).json({ status: "error", message: "There was an error with the request" });
  }
};
