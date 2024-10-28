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
    const { site, hrs } = req.query;

    if (site && hrs) {
      const url = `http://aviationweather.gov/api/data/metar?ids=${site}&hours=${hrs}&format=json`;

      console.log("requesting metars from:", url);

      const metarObjects: MetarObject[] = await axios.get(url).then((metars) => metars.data);

      const output = metarObjects.reverse().map((m: MetarObject) => m.rawOb);

      res.status(200).json({ metars: output });
    } else {
      res.status(400).json({ metars: [] });
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(503);
  }
};

export const siteData = async (req: Request, res: Response) => {
  try {
    const { site } = req.query;

    if (site) {
      const url = `http://aviationweather.gov/api/data/stationinfo?ids=${site}&format=json`;

      console.log("requesting station info from:", url);

      const siteData: StationObject = await axios.get(url).then((site) => site.data[0]);

      const times: GetTimesResult = suncalc.getTimes(new Date(), siteData.lat, siteData.lon);

      const riseString: string =
        leadZero(times.sunrise.getUTCHours()) + ":" + leadZero(times.sunrise.getUTCMinutes()) + "Z";
      const setString: string =
        leadZero(times.sunsetStart.getUTCHours()) + ":" + leadZero(times.sunsetStart.getUTCMinutes()) + "Z";

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
    } else {
      res.status(400).json({
        icaoID: "Unknown",
        location: "Unknown",
        lat: "Unknown",
        lon: "Uknown",
        elev_f: "Uknown",
        elev_m: "Uknown",
        sunrise: "Uknown",
        sunset: "Uknown",
      });
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};

export const taf = async (req: Request, res: Response) => {
  try {
    const { site } = req.query;

    if (site) {
      const url = `http://aviationweather.gov/api/data/taf?ids=${site}&format=json`;

      console.log("requesting taf from:", url);

      const tafObject: TafObject = await axios.get(url).then((taf) => taf.data[0]);

      const rawTAF = tafObject.rawTAF.replaceAll(/(FM|TEMPO|BECMG|PROB|RMK)/g, "\n$1");

      const tafMain = rawTAF.match(
        /((TAF\s)?(AMD\s)?(\w{4}\s\d{6}Z\s\d{4}\/\d{4}\s)(\d{5}|VRB\d{2})(G\d{2})?(KT.+))/g
      ) as string[];

      const partPeriods = [...rawTAF.matchAll(/(TEMPO.+|PROB30.+|PROB40.+|BECMG.+|FM\d{6}.+)/g)].map((pp) =>
        pp[0].trim()
      );

      res.status(200).json({
        main: tafMain[0].trim(),
        partPeriods: partPeriods,
        rmk: tafObject.remarks,
      });
    } else {
      res.status(400).json({
        main: "",
        partPeriods: [],
        rmk: "",
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

    const url = "https://metaviation.ec.gc.ca/hubwx/scripts/getForecasterNotes.php";

    console.log("requesting hub discussions from:", url);

    const hubs: HubDiscussion = await axios.get(url).then((hub) => hub.data);

    switch (site) {
      case "cyyz":
        res.status(200).json({
          siteName: "Toronto Pearson Intl Airport",
          text: hubs.CYYZ.strtext,
        });
        break;
      case "cyyc":
        res.status(200).json({ siteName: "Calgary Intl Airport", text: hubs.CYYC.strtext });
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
