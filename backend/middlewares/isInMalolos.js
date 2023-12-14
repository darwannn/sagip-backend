const axios = require("axios");
const { isEmpty } = require("../controllers/functionController");
const isInMalolos = async (req, res, next) => {
  try {
    const error = {};
    const { latitude, longitude } = req.body;
    if (isEmpty(latitude)) error["latitude"] = "Mark a location";
    if (isEmpty(longitude)) error["longitude"] = "Mark a location";
    if (Object.keys(error).length === 0) {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

      const response = await axios.get(geocodeUrl);

      const results = response.data.results;

      if (results && results.length > 0) {
        const addressComponents = results[0].address_components;
        let streetCode = addressComponents.find((component) =>
          component.types.includes("plus_code")
        );
        const street = addressComponents.find((component) =>
          component.types.includes("route")
        );
        const municipality = addressComponents.find((component) =>
          component.types.includes("locality")
        );
        let streetName;
        let municipalityName;
        let streetNumber;

        if (street) {
          if (street.long_name.includes("+")) {
            streetNumber = "";
          } else {
            streetName = street.long_name.split(" Street")[0];
          }
        } else {
          streetName = "";
        }
        if (municipality) {
          municipalityName = municipality.long_name;
        } else {
          municipalityName = "";
        }
        if (streetCode) {
          if (streetCode.long_name.includes("+")) {
            streetNumber = "";
          } else {
            streetNumber = streetCode.long_name;
          }
        } else {
          streetNumber = "";
        }
        if (municipalityName !== "Malolos") {
          return res.status(400).json({
            success: false,
            latitude: "Unfortunately, the selected area is outside Malolos",
            longitude: "Unfortunately, the selected area is outside Malolos",
            message: "input error",
          });
          
        } else {
          let combinedStreet = streetNumber
            ? `${streetNumber} ${streetName}`
            : streetName;
          if (combinedStreet !== "") {

            if (
              !combinedStreet.toLowerCase().includes("highway") &&
              !combinedStreet.toLowerCase().includes("road")
            )
              combinedStreet = `${combinedStreet} Street`;
          }
          req.body.street = combinedStreet;
          req.body.municipality = municipalityName;
          next();
        }
      } else {
        return res.status(400).json({
          success: false,
          latitude: "No results found for the provided location",
          longitude: "No results found for the provided location",
          message: "input error",
        });
      }
    }

    if (Object.keys(error).length !== 0) {
      error["success"] = false;
      error["message"] = "input error";
      return res.status(400).json(error);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error,
      /* error: error.message, */
    });
  }
};

module.exports = isInMalolos;
