const path = require('path');
const express = require('express');
const Service = require('./services');

const app = express();

app.get('/aggregateData', (req, res) => {
  const params = req.query;
  Service.getAggregateData(params)
    .then(data => {
      res
        .status(200)
        .send(data);
    })
    .catch(err => {
      res
        .status((err && err.status) || 500)
        .send((err && err.message) || 'Something went wrong');
    });
});

app.use('/', express.static(path.join(__dirname, '/')));

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('Server running on port ', port);
});
