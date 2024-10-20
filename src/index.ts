import express, { Request, Response } from "express";
import { metars, taf, siteData } from "./endpoints/aviation";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript Express!");
});

app.get("/metars", metars);
app.get("/sitedata", siteData);
app.get("/taf", taf);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
