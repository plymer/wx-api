import axios from "axios";
import suncalc, { GetTimesResult } from "suncalc";
import { Request, Response } from "express";
import { MetarObject, StationObject, TafObject } from "../lib/types";
import { FEET_PER_METRE, leadZero } from "../lib/utils";

export const metars = async (req: Request, res: Response) => {
  try {
    const { siteID, numHrs } = req.query;

    const url = `http://aviationweather.gov/api/data/metar?ids=${siteID}&hours=${numHrs}&format=json`;

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
    const { siteID } = req.query;

    const url = `http://aviationweather.gov/api/data/stationinfo?ids=${siteID}&format=json`;

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
    const { siteID } = req.query;

    const url = `http://aviationweather.gov/api/data/taf?ids=${siteID}&format=json`;

    console.log("requesting taf from:", url);

    const tafObject: TafObject = await axios
      .get(url)
      .then((taf) => taf.data[0]);

    // we can do some regex on this tafObject.rawTAF

    res.status(200).json({ taf: tafObject.rawTAF });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};
