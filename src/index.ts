import express, { Request, Response } from "express";
import { metars, taf, siteData, hubs, gfa, sigwx, lgf } from "./endpoints/aviation";
import endpoints from "./endpoints.json";
import cors from "cors";

// initialize the server
const app = express();
const port = process.env.PORT || 3000;

// enable json
app.use(express.json());

// enable cors
app.use(cors());

// add endpoints - base will return endpoint definitions
app.get("/", (req: Request, res: Response) => {
  res.send(endpoints);
});

// aviation endpoints
app.get("/alpha/metars", metars);
app.get("/alpha/sitedata", siteData);
app.get("/alpha/taf", taf);
app.get("/alpha/hubs", hubs);
app.get("/charts/gfa", gfa);
app.get("/charts/sigwx", sigwx);
app.get("/charts/lgf", lgf);

// public endpoints

// general endpoints
app.get("/gfy", (req: Request, res: Response) => {
  res.send("Eh, go fuck yaself");
});

// start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
