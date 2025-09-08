const data = require('countrycitystatejson');

// ✅ Get all countries
exports.getCountries = (req, res) => {
  try {
    const countries = data.getCountries().map(c => ({
      shortName: c.shortName, // e.g. 'IN'
      name: c.name,           // e.g. 'India'
      native: c.native,
      phone: c.phone,
      continent: c.continent,
    }));
    res.json({ success: true, countries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ✅ Get states by country short code
exports.getStatesByCountry = (req, res) => {
  try {
    const { countryShort } = req.params;
    const states = data.getStatesByShort(countryShort) || [];
    res.json({ success: true, states });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ✅ Get cities by country + state
exports.getCitiesByState = (req, res) => {
  try {
    const { countryShort, state } = req.params;
    const decodedState = decodeURIComponent(state); // handle spaces
    const cities = data.getCities(countryShort, decodedState) || [];
    res.json({ success: true, cities });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
