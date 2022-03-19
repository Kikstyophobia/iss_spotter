const request = require('request');

const fetchMyIP = function(callback) {
  request('https://api.ipify.org?format=json', (error, response, body) => {
    if (error) {
      return callback(error, null);
    }

    if (response.statusCode !== 200) {
      callback(Error(`Status Code ${response.statusCode} when fetching IP: ${body}`), null);
      return;
    }

    const ip = JSON.parse(body).ip;
    callback(null, ip);

  });
};

const fetchCoordsByIP = function(ip, callback) {
  request(`https://api.freegeoip.app/json/${ip}?apikey=acb9e2e0-a661-11ec-a792-7dd4a93f9cf4`, (error, response, body) => {

    if (response.statusCode !== 200) {
      const errorMsg = `Status code ${response.statusCode} when fetching coordinates for IP. Response: ${body}`;
      callback(Error(errorMsg), null);
      return;
    }

    let parsedBody = JSON.parse(body);
    let longitude = parsedBody.longitude;
    let latitude = parsedBody.latitude;
    let longLat = {
      longitude,
      latitude
    };
    
    callback(null, longLat);

  });
};

const fetchISSFlyOverTimes = function(coords, callback) {
 
  request(`https://iss-pass.herokuapp.com/json/?lat=${coords.latitude}&lon=${coords.longitude}`, (error, response, body) => {
    if (error) {
      return callback(error, null);
    }

    if (response.statusCode !== 200) {
      callback(Error(`Status Code ${response.statusCode} when using Longitude: ${coords.longitude}, Latitude: ${coords.latitude}`), null);
      return;
    }

    let parsedBody = JSON.parse(body);
    let riseTime = parsedBody.response;
    let message = parsedBody.message;
    let request = parsedBody.request;
    
    callback(null, {message, request, riseTime});

  });
};

/**
 * Orchestrates multiple API requests in order to determine the next 5 upcoming ISS fly overs for the user's current location.
 * Input:
 *   - A callback with an error or results. 
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly-over times as an array (null if error):
 *     [ { risetime: <number>, duration: <number> }, ... ]
 */ 
const nextISSTimesForMyLocation = function(callback) {
  
  fetchMyIP((error, ip) => {
    if (error) {
      return callback(error, null);
    }
    fetchCoordsByIP(ip, (error, ip) => {
      if (error) {
        return callback(error, null);
      }
      fetchISSFlyOverTimes(ip, (error, info) => {
        if (error) {
          return callback(error, null);
        }
        return callback(null, info);
      })
    })
  })
};

module.exports = { fetchMyIP, fetchCoordsByIP, fetchISSFlyOverTimes, nextISSTimesForMyLocation };