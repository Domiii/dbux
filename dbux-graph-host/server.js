const path = require('path');
const express = require('express');
const app = express();
const port = 3040;

const dataFolder = path.resolve(__dirname, '..', 'analysis', '__data__');

app.use(express.static('public'));
app.use(express.static('dist'));
app.use('/data', express.static(dataFolder));


app.listen(port, () => console.log(`Listening on port ${port}. data/ path mounted at`, dataFolder));