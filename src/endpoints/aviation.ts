import axios from "axios";
import { Request, Response } from "express";
import { MetarObject, StationObject, TafObject } from "../lib/types";

export const metars = async (req: Request, res: Response) => {
  try {
    const { siteID, numHrs } = req.query;

    const url = `http://aviationweather.gov/api/data/metar?ids=${siteID}&hours=${numHrs}&format=json`;

    console.log("requesting metars from:", url);

    const metarObjects: MetarObject = await axios
      .get(url)
      .then((metars) => metars.data);

    res.status(200).json(metarObjects);
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

    const siteObject: StationObject = await axios
      .get(url)
      .then((site) => site.data);

    res.status(200).json(siteObject);
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

    const tafObject: TafObject = await axios.get(url).then((taf) => taf.data);

    res.status(200).json(tafObject);
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};
