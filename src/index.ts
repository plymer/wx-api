import express, { Request, Response } from "express";
import { metars, taf, siteData, hubs } from "./endpoints/aviation";

// initialize the server
const app = express();
const port = process.env.PORT || 3000;

// enable json
app.use(express.json());

// add endpoints
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript Express!");
});

app.get("/metars", metars);
app.get("/sitedata", siteData);
app.get("/taf", taf);
app.get("/hubs", hubs);

// start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
