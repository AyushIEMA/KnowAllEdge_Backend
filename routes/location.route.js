const express = require('express');
const router = express.Router();
const controller = require('../controllers/location.controller');

// Get all countries
router.get('/countries', controller.getCountries);

// Get states for a country (use short code, e.g. IN, US)
router.get('/states/:countryShort', controller.getStatesByCountry);

// Get cities for a given state
router.get('/cities/:countryShort/:state', controller.getCitiesByState);

module.exports = router;
