import express, { Request, Response } from "express";

const app = express();
const port = 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript Express!");
});

app.get("/hello", (req: Request, res: Response) => {
  res.send("Another endpoint!");
  console.log("hitting /hello");
});

app.listen(() => {
  console.log(`Server running at http://localhost:${port}`);
});
