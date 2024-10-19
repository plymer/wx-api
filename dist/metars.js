"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metars = void 0;
const axios_1 = __importDefault(require("axios"));
const metars = async (req, res) => {
    try {
        const { siteID, numHrs } = req.query;
        console.log(`http://aviationweather.gov/api/data/metar?ids=${siteID}&hours=${numHrs}&format=json`);
        const metarObjects = await axios_1.default
            .get(`http://aviationweather.gov/api/data/metar?ids=${siteID}&hours=${numHrs}&format=json`)
            .then((metars) => metars.data);
        res.status(200).json(metarObjects);
    }
    catch (error) {
        // console.log(error);
        res.sendStatus(400);
    }
};
exports.metars = metars;
