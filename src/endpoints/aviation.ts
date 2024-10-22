import axios from "axios";
import suncalc, { GetTimesResult } from "suncalc";
import { Request, Response } from "express";
import {
  HubDiscussion,
  MetarObject,
  StationObject,
  TafObject,
} from "../lib/aviation-types";
import { FEET_PER_METRE, leadZero } from "../lib/utils";

export const metars = async (req: Request, res: Response) => {
  try {
    const { site, hrs } = req.query;

    const url = `http://aviationweather.gov/api/data/metar?ids=${site}&hours=${hrs}&format=json`;

    console.log("requesting metars from:", url);

    const metarObjects: MetarObject[] = await axios
      .get(url)
      .then((metars) => metars.data);

    const output = metarObjects.reverse().map((m: MetarObject) => m.rawOb);

    res.status(200).json({ metars: output });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};

export const siteData = async (req: Request, res: Response) => {
  try {
    const { site } = req.query;

    const url = `http://aviationweather.gov/api/data/stationinfo?ids=${site}&format=json`;

    console.log("requesting station info from:", url);

    const siteData: StationObject = await axios
      .get(url)
      .then((site) => site.data[0]);

    const times: GetTimesResult = suncalc.getTimes(
      new Date(),
      siteData.lat,
      siteData.lon
    );

    const riseString: string =
      leadZero(times.sunrise.getUTCHours()) +
      ":" +
      leadZero(times.sunrise.getUTCMinutes()) +
      "Z";
    const setString: string =
      leadZero(times.sunsetStart.getUTCHours()) +
      ":" +
      leadZero(times.sunsetStart.getUTCMinutes()) +
      "Z";

    res.status(200).json({
      icaoId: siteData.icaoId,
      location: siteData.site + ", " + siteData.state,
      lat:
        siteData.lat > 0
          ? (Math.round(siteData.lat * 10) / 10).toString() + "°N"
          : Math.abs(Math.round(siteData.lat * 10) / 10).toString() + "°S",
      lon:
        siteData.lon > 0
          ? (Math.round(siteData.lon * 10) / 10).toString() + "°E"
          : Math.abs(Math.round(siteData.lon * 10) / 10).toString() + "°W",
      elev_f: Math.floor(siteData.elev * FEET_PER_METRE) + " ft",
      elev_m: siteData.elev + " m",
      sunrise: riseString,
      sunset: setString,
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};

export const taf = async (req: Request, res: Response) => {
  try {
    const { site } = req.query;

    const url = `http://aviationweather.gov/api/data/taf?ids=${site}&format=json`;

    console.log("requesting taf from:", url);

    const tafObject: TafObject = await axios
      .get(url)
      .then((taf) => taf.data[0]);

    const rawTAF = tafObject.rawTAF.replaceAll(
      /(FM|TEMPO|BECMG|PROB|RMK)/g,
      "\n$1"
    );

    const tafMain = rawTAF.match(
      /((TAF\s)?(AMD\s)?(\w{4}\s\d{6}Z\s\d{4}\/\d{4}\s)(\d{5}|VRB\d{2})(G\d{2})?(KT.+))/g
    ) as string[];

    const partPeriods = [
      ...rawTAF.matchAll(/(TEMPO.+|PROB30.+|PROB40.+|BECMG.+|FM\d{6}.+)/g),
    ].map((pp) => pp[0].trim());

    res.status(200).json({
      main: tafMain[0].trim(),
      partPeriods: partPeriods,
      rmk: tafObject.remarks,
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};

export const hubs = async (req: Request, res: Response) => {
  try {
    const { site } = req.query;

    const url =
      "https://metaviation.ec.gc.ca/hubwx/scripts/getForecasterNotes.php";

    const hubs: HubDiscussion = await axios.get(url).then((tp) => tp.data);

    switch (site) {
      case "cyyz":
        res.status(200).json({
          siteName: "Toronto Pearson Intl Airport",
          text: hubs.CYYZ.strtext,
        });
        break;
      case "cyyc":
        res
          .status(200)
          .json({ siteName: "Calgary Intl Airport", text: hubs.CYYC.strtext });
        break;
      case "cyvr":
        res.status(200).json({
          siteName: "Vancouver Intl Airport",
          text: hubs.CYVR.strtext,
        });
        break;
      case "cyul":
        res.status(200).json({
          siteName: "Montreal Trudeau Airport",
          text: hubs.CYUL.strtext,
        });
        break;
      default:
        res.status(200).json({
          siteName: `${site}`,
          text: `No hub discussion available for ${site}`.toUpperCase(),
        });
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};
