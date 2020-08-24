
import express from "express";
import { login as loginRoute } from "./routes/login";

const app = express();
const port = 2719;

app.get('/', loginRoute);

app.listen(port, () => {
  console.log(`Express is listening on http://localhost:${port}.`);
});