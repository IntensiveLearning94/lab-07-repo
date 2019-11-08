'use strict';

// npm packages - 3rd party

require('dotenv').config();

const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
// application constant


const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());

let location = {};

// http://localhost:3000/location?data=seattle

function locationHandler(request, response) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GOOGLEAPI}`;

  // console.log(request.query.data)

  if (location[url]) {
    response.send(location[url]);
  }
  else {
    superagent.get(url)
      .then(data => {
        const geoData = data.body;
        const newLocation = new Locations(request.query.data, geoData);
        location[url] = newLocation;
        response.send(newLocation);
      })
      .catch(() => {
        errorHandler('Error something isn\'t right!', request, response);
      });
  }
}

function weatherHandler(request, response) {
  const url = `https://api.darksky.net/forecast/${process.env.DARKSKYAPI}/${request.query.data.latitude},${request.query.data.longitude}`;

  superagent.get(url)
    .then(data => {
      const weatherSummaries = data.body.daily.data.map(day => {
        return new Weather(day);
      });
      response.status(200).json(weatherSummaries);
    })
    .catch(() => {
      errorHandler('something went wrong.', request, response);
    });

}

function yelpHandler(request, response) {
  const url = `https://api.yelp.com/v3/businesses/search?term=delis&latitude=${request.query.data.latitude}&longitude=${request.query.data.longitude}`;

  superagent.get(url)
    .set('Authorization', `Bearer ${process.env.YELPAPI}`)
    .then(data => {
      const yelpSummaries = data.body.businesses.map(food => {
        return new Yelp(food);
      });
      response.status(200).json(yelpSummaries);
    })
    .catch(() => {
      errorHandler('something went wrong.', request, response);
    });

}


function Yelp(restaraunt) {

  this.name = restaraunt.name;
  this.image_url = restaraunt.image_url;
  this.price = restaraunt.price;
  this.rating = restaraunt.rating;
  this.url = restaraunt.url;

}
function Weather(day) {
  this.summary = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}
function Locations(query, geoData) {
  this.search_query = query;
  this.formatted_query = geoData.results[0].formatted_address;
  this.latitude = geoData.results[0].geometry.location.lat;
  this.longitude = geoData.results[0].geometry.location.lng;
}


app.listen(PORT, () => {
  console.log(`listening on PORT ${PORT}`);
});

function notFoundHandler(request, response) {
  response.status(404).send('say what!!!');
}

function errorHandler(error, request, response) {
  response.status(500).send(error);
}





app.get('/location', locationHandler);
app.get('/yelp', yelpHandler);
app.get('/weather', weatherHandler);
app.get('*', notFoundHandler);
app.use(errorHandler);


app.listen(PORT, () => console.log(`Listening on ${PORT}`));
