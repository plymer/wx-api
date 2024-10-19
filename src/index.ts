import express, { Request, Response } from "express";
import { metars } from "./metars";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript Express!");
});

app.get("/metars", metars);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
