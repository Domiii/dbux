
import express from "express";

const app = express();
const port = 2719;

app.post('/', (request, response) => {

});

app.listen(port, () => {
  console.log(`Express is listening on http://localhost:${port}.`);
});