import axios from "axios";
import { Request, Response, NextFunction } from "express";

export const metars = async (req: Request, res: Response) => {
  try {
    const { siteID, numHrs } = req.query;

    console.log(
      `http://aviationweather.gov/api/data/metar?ids=${siteID}&hours=${numHrs}&format=json`
    );

    const metarObjects = await axios
      .get(
        `http://aviationweather.gov/api/data/metar?ids=${siteID}&hours=${numHrs}&format=json`
      )
      .then((metars) => metars.data);

    res.status(200).json(metarObjects);
  } catch (error) {
    // console.log(error);
    res.sendStatus(400);
  }
};
