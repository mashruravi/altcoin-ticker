'use strict';

const MongoClient = require('mongodb').MongoClient;
const Constants = require('./constants');

let url = '';
if (process.env.VCAP_SERVICES) {
  const vcap_services = JSON.parse(process.env.VCAP_SERVICES);
  url = vcap_services.mongodb[0].credentials.uri;
} else {
  url = 'mongodb://localhost:27017/altcoin';
}

const _getDbInstance = () => {
  return new Promise((resolve, reject) => {
    MongoClient.connect(url, (err, db) => {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      resolve(db);
    });
  });
};

// 'range' parameter is in days, 'interval' in minutes
const _getRangeStartDate = (range, interval) => {
  const now = new Date();
  now.setSeconds(0);
  now.setMilliseconds(0);

  now.setDate(now.getDate() - range);

  if ([5, 15, 30].indexOf(interval) > -1) {
    const minutes = now.getMinutes();
    const diff = minutes % 5;
    now.setMinutes(minutes - diff);
  } else if ([60, 120, 240].indexOf(interval) > -1) {
    now.setMinutes(0);
  } else {
    now.setMinutes(0);
    now.setHours(0);
  }

  return now;
};

const _getIntervalBoundaries = (startDate, endDate, interval) => {
  const intervals = [];

  const d = new Date(startDate.getTime());
  while (d.getTime() < endDate.getTime()) {
    const intervalStart = new Date(d.getTime());
    const intervalEnd = new Date(d.getTime());
    intervalEnd.setMinutes(intervalEnd.getMinutes() + interval - 1);

    intervals.push({
      start: intervalStart,
      end: intervalEnd
    });

    d.setMinutes(d.getMinutes() + interval);
  }

  return intervals;
};

const _getRecords = (collection, intervals) => {
  return new Promise((resolve, reject) => {
    _getDbInstance()
      .then(db => {
        const col = db.collection(collection);
        const data = [];
        for (const i in intervals) {
          col
            .find({
              $and: [
                { date: { $gte: intervals[i].start } },
                { date: { $lte: intervals[i].end } }
              ]
            })
            .toArray((err, arr) => {
              if (err) {
                reject({
                  message: err.message
                });
                return;
              }
              data.push({
                interval: intervals[i],
                data: arr
              });

              if (data.length === intervals.length) {
                db.close();
                resolve(data);
              }
            });
        }
      })
      .catch(err => {
        console.error(err.message || 'Could not get database instance.');
        reject({
          status: 500,
          message: {
            message: err.message
          }
        });
      });
  });
};

module.exports = {
  getAggregateData: params => {
    return new Promise((resolve, reject) => {
      const range = parseFloat(params.range || 1);
      const interval = parseInt(params.interval || 15);
      const altcoinCode = params.coin.toUpperCase();
      const collection = Constants.dbCollection[altcoinCode];

      if (!altcoinCode) {
        reject({
          status: 400,
          message: {
            message: 'Please specify a coin using the "coin" query parameter.'
          }
        });
        return;
      }

      const rangeStart = _getRangeStartDate(range, interval);
      const intervals = _getIntervalBoundaries(
        rangeStart,
        new Date(),
        interval
      );

      _getRecords(collection, intervals)
        .then(records => {
          const data = [];
          for (const r in records) {
            const i = records[r].interval;
            const d = records[r].data;

            if (d.length === 0) {
              continue;
            }

            let min = d[0].min;
            let max = d[0].max;

            d.forEach(e => {
              if (e.min < min) {
                min = e.min;
              } else if (e.max > max) {
                max = e.max;
              }
            });

            data.push({
              intervalStart: i.start,
              intervalEnd: i.end,
              open: d[0].open,
              close: d[d.length - 1].close,
              min: min,
              max: max
            });
          }

          resolve(data);
        })
        .catch(err => {
          reject({
            status: 500,
            message: {
              message: err.message || 'Could not get records from the database'
            }
          });
        });
    });
  }
};
