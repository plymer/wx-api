import express, { Request, Response } from "express";
import { metars, taf, siteData, hubs } from "./endpoints/aviation";
import endpoints from "./endpoints.json";

// initialize the server
const app = express();
const port = process.env.PORT || 3000;

// enable json
app.use(express.json());

// add endpoints - base will return endpoint definitions
app.get("/", (req: Request, res: Response) => {
  res.send(endpoints);
});

// aviation endpoints
app.get("/metars", metars);
app.get("/sitedata", siteData);
app.get("/taf", taf);
app.get("/hubs", hubs);

// public endpoints

// general endpoints

// start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
