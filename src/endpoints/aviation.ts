import axios from "axios";
import suncalc, { GetTimesResult } from "suncalc";
import { Request, Response } from "express";
import { FEET_PER_METRE, leadZero } from "../lib/utils";

// type definitions for response data
import {
  HubDiscussion,
  MetarObject,
  NavCanImageList,
  NavCanResponse,
  StationObject,
  TafObject,
} from "../lib/aviation-types";

export const metars = async (req: Request, res: Response) => {
  try {
    // we might need to mutate the site variable
    let { site, hrs } = req.query;

    // check if we are missing any queryParams
    if (!site || !hrs) {
      res
        .status(400)
        .json({ status: "error", error: `one or more parameters are missing - site: '${site}' | hrs: '${hrs}'` });
      return;
    }

    // do a conversion for CYEU -> CWEU
    site.toString().toUpperCase() === "CYEU" ? (site = "CWEU") : "";

    // begin data retrieval
    const url = `http://aviationweather.gov/api/data/metar?ids=${site}&hours=${hrs}&format=json`;
    console.log("requesting metars from:", url);
    const metarObjects: MetarObject[] | string = await axios.get(url).then((metars) => metars.data);

    // check for the presence of valid data, otherwise return an error message
    if (metarObjects.length === 0 || metarObjects === "error retrieving data") {
      // we do not have any METARs that we can return, so send an empty response
      res.status(400).json({
        status: "error",
        error: `no METARs found for '${site?.toString().toUpperCase()}'`,
      });
      return;
    }

    // if our returned value is an object, we know we have valid output
    if (typeof metarObjects === "object") {
      const output = metarObjects.reverse().map((m: MetarObject) => m.rawOb);
      res.status(200).json({ status: "success", metars: output });
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(503);
  }
};

export const siteData = async (req: Request, res: Response) => {
  try {
    // we might need to mutate the site variable
    let { site } = req.query;

    // check if we are missing any queryParams
    if (!site) {
      res.status(400).json({ status: "error", error: `one or more parameters are missing - site: '${site}'` });
      return;
    }

    // do a conversion for CWEU -> CYEU
    site.toString().toUpperCase() === "CWEU" ? (site = "CYEU") : "";

    const url = `http://aviationweather.gov/api/data/stationinfo?ids=${site}&format=json`;
    console.log("requesting station info from:", url);
    const siteData: StationObject[] = await axios.get(url).then((site) => site.data);

    // check for the presence of valid data, otherwise return an error message
    if (siteData.length === 0) {
      // we do not have any site data that we can return, so send an empty response
      res.status(400).json({
        status: "error",
        error: `no Site Data found for '${site?.toString().toUpperCase()}'`,
      });
      return;
    }

    if (typeof siteData === "object") {
      // create a suncalc time object
      const times: GetTimesResult = suncalc.getTimes(new Date(), siteData[0].lat, siteData[0].lon);

      // set sunrise and sunset times to "---" when the sun doesn't rise or set today
      const riseString: string =
        times.sunrise.getUTCHours().toString() !== "NaN"
          ? leadZero(times.sunrise.getUTCHours()) + ":" + leadZero(times.sunrise.getUTCMinutes()) + "Z"
          : "---";
      const setString: string =
        times.sunsetStart.getUTCHours().toString() !== "NaN"
          ? leadZero(times.sunsetStart.getUTCHours()) + ":" + leadZero(times.sunsetStart.getUTCMinutes()) + "Z"
          : "---";

      // return the site data object
      res.status(200).json({
        status: "success",
        metadata: {
          icaoId: siteData[0].icaoId,
          location: siteData[0].site + ", " + siteData[0].state,
          lat:
            siteData[0].lat > 0
              ? (Math.round(siteData[0].lat * 10) / 10).toString() + "°N"
              : Math.abs(Math.round(siteData[0].lat * 10) / 10).toString() + "°S",
          lon:
            siteData[0].lon > 0
              ? (Math.round(siteData[0].lon * 10) / 10).toString() + "°E"
              : Math.abs(Math.round(siteData[0].lon * 10) / 10).toString() + "°W",
          elev_f: Math.floor(siteData[0].elev * FEET_PER_METRE) + " ft",
          elev_m: siteData[0].elev + " m",
          sunrise: riseString,
          sunset: setString,
        },
      });
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};

export const taf = async (req: Request, res: Response) => {
  try {
    // we may need to mutate the site variable
    let { site } = req.query;

    if (!site) {
      res.status(400).json({ status: "error", error: `one or more parameters are missing - site: '${site}'` });
      return;
    }

    // do a conversion for CWEU -> CYEU
    site.toString().toUpperCase() === "CWEU" ? (site = "CYEU") : "";

    const url = `http://aviationweather.gov/api/data/taf?ids=${site}&format=json`;
    console.log("requesting taf from:", url);
    const tafObject: TafObject[] | string = await axios.get(url).then((taf) => taf.data);

    // no match for a taf site on avwx.gov returns zero-length array of json, or for an error
    // returns a string of "error retrieving data"
    if (tafObject.length === 0 || tafObject === "error retrieving data") {
      // we do not have a TAF that we can return, so send an empty response
      res.status(400).json({
        status: "error",
        error: `no TAF found for '${site?.toString().toUpperCase()}'`,
      });
      return;
    }

    if (typeof tafObject === "object") {
      // we have a valid TAF to return, so begin data mutation to our desired output format
      const rawTAF = tafObject[0].rawTAF.replaceAll(/(FM|TEMPO|BECMG|PROB|RMK)/g, "\n$1");

      const tafMain = rawTAF.match(
        /((TAF\s)?(AMD\s)?(\w{4}\s\d{6}Z\s\d{4}\/\d{4}\s)(\d{5}|VRB\d{2})(G\d{2})?(KT.+))/g
      ) as string[];

      const partPeriods = [...rawTAF.matchAll(/(TEMPO.+|PROB30.+|PROB40.+|BECMG.+|FM\d{6}.+)/g)].map((pp) =>
        pp[0].trim()
      );

      res.status(200).json({
        status: "success",
        taf: {
          main: tafMain[0].trim(),
          partPeriods: partPeriods,
          rmk: tafObject[0].remarks,
        },
      });
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};

export const hubs = async (req: Request, res: Response) => {
  try {
    const { site } = req.query;

    // check if we are missing any queryParams
    if (!site) {
      res.status(400).json({ status: "error", error: `one or more parameters are missing - site: '${site}'` });
      return;
    }

    // check to see if we have requested a hub or not
    if (site !== "cyyz" && "cyul" && "cyvr" && "cyyc") {
      res.status(200).json({
        message: "error",
        error: `No hub discussion available for '${site.toString().toUpperCase()}'`,
      });
      return;
    }

    // we have passed all the tests, get the data
    const url = "https://metaviation.ec.gc.ca/hubwx/scripts/getForecasterNotes.php";
    console.log("requesting hub discussions from:", url);
    const hubs: HubDiscussion = await axios.get(url).then((hub) => hub.data);

    // i hate the way the data is returned but maybe that will change in the future
    switch (site) {
      case "cyyz":
        res.status(200).json({
          message: "success",
          hubData: {
            siteName: "Toronto Pearson Intl Airport",
            header: hubs.CYYZ.strheaders,
            discussion: hubs.CYYZ.strdiscussion,
            outlook: hubs.CYYZ.stroutlook,
            forecaster: hubs.CYYZ.strforecaster,
            office: hubs.CYYZ.stroffice,
          },
        });
        break;
      case "cyyc":
        res.status(200).json({
          message: "success",
          hubData: {
            siteName: "Calgary Intl Airport",
            header: hubs.CYYC.strheaders,
            discussion: hubs.CYYC.strdiscussion,
            outlook: hubs.CYYC.stroutlook,
            forecaster: hubs.CYYC.strforecaster,
            office: hubs.CYYC.stroffice,
          },
        });
        break;
      case "cyvr":
        res.status(200).json({
          message: "success",
          hubData: {
            siteName: "Vancouver Intl Airport",
            header: hubs.CYVR.strheaders,
            discussion: hubs.CYVR.strdiscussion,
            outlook: hubs.CYVR.stroutlook,
            forecaster: hubs.CYVR.strforecaster,
            office: hubs.CYVR.stroffice,
          },
        });
        break;
      case "cyul":
        res.status(200).json({
          message: "success",
          hubData: {
            siteName: "Montreal Trudeau Airport",
            header: hubs.CYUL.strheaders,
            discussion: hubs.CYUL.strdiscussion,
            outlook: hubs.CYUL.stroutlook,
            forecaster: hubs.CYUL.strforecaster,
            office: hubs.CYUL.stroffice,
          },
        });
        break;
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};

export const gfa = async (req: Request, res: Response) => {
  try {
    const url =
      "https://plan.navcanada.ca/weather/api/alpha/?site=CYEG&site=CYVR&site=CYZF&site=CYFB&site=CYYZ&site=CYHZ&site=CYRB&image=GFA/CLDWX&image=GFA/TURBC";

    console.log("requesting gfas from:", url);

    const ncAPIData: NavCanResponse = await axios.get(url).then((gfas) => gfas.data);

    const rawList = ncAPIData.data.map((region) => JSON.parse(region.text) as NavCanImageList);

    // i am too lazy to define this type-shape so we will ts-ignore the type assigment error below because this is a valid piece of code
    let results = {};
    rawList.forEach((gfa) => {
      if (Object.hasOwn(results, gfa.geography.toLowerCase())) {
        // the gfa is already in our results, but we need to add it's CLDWX or TURBC data to the results
        //@ts-ignore
        Object.assign(results[gfa.geography.toLowerCase()], {
          [gfa.sub_product.toLowerCase()]: gfa.frame_lists[2].frames.map(
            (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image"
          ),
        });
      } else {
        Object.assign(results, {
          [gfa.geography.toLowerCase()]: {
            [gfa.sub_product.toLowerCase()]: gfa.frame_lists[2].frames.map(
              (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image"
            ),
          },
        });
      }
    });

    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};

export const sigwx = async (req: Request, res: Response) => {
  try {
    const url = "https://plan.navcanada.ca/weather/api/alpha/?site=CYHZ&image=SIG_WX//MID_LEVEL/*&image=TURBULENCE";

    console.log("requesting sigwx charts from:", url);

    const ncAPIData: NavCanResponse = await axios.get(url).then((gfas) => gfas.data);

    const rawList = ncAPIData.data.map((region) => JSON.parse(region.text) as NavCanImageList);

    // i am too lazy to define this type-shape so we will ts-ignore the type assigment error below because this is a valid piece of code
    let results = {};
    rawList.forEach((p) => {
      const product = p.product.toLowerCase();

      if (Object.hasOwn(results, product)) {
        // the product is already in our results, but we need to add the other type of chart to the results
        //@ts-ignore
        Object.assign(results[product], {
          [product === "turbulence" ? p.geography.toLowerCase() : p.sub_geography.toLowerCase()]:
            p.frame_lists[0].frames.map(
              (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image"
            ),
        });
      } else {
        Object.assign(results, {
          [product]: {
            [product === "turbulence" ? p.geography.toLowerCase() : p.sub_geography.toLowerCase()]:
              p.frame_lists[0].frames.map(
                (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image"
              ),
          },
        });
      }
    });

    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};

export const lgf = async (req: Request, res: Response) => {
  try {
    const url = "https://plan.navcanada.ca/weather/api/alpha/?site=CYPR&site=CYZT&image=LGF";

    console.log("requesting lgfs from:", url);

    const ncAPIData: NavCanResponse = await axios.get(url).then((lgfs) => lgfs.data);

    const rawList = ncAPIData.data.map((region) => JSON.parse(region.text) as NavCanImageList);

    let results = {};
    rawList.forEach((lgf) => {
      Object.assign(results, {
        [lgf.geography.toLowerCase()]: lgf.frame_lists[lgf.frame_lists.length - 1].frames.map(
          (f) => "https://plan.navcanada.ca/weather/images/" + f.images[f.images.length - 1].id + ".image"
        ),
      });
    });

    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};
