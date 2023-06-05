export const reverseGeoCoding = (latitude, longitude, callback) => {
  const geocoder = new window.google.maps.Geocoder();
  const latlng = { lat: latitude, lng: longitude };

  geocoder.geocode({ location: latlng }, (results, status) => {
    if (status === "OK") {
      if (results[0]) {
        const addressComponents = results[0].address_components;
        const street = addressComponents.find((component) =>
          component.types.includes("route")
        );
        const barangay = addressComponents.find((component) =>
          component.types.includes("barangay")
        );
        const premise = addressComponents.find((component) =>
          component.types.includes("premise")
        );
        const municipality = addressComponents.find((component) =>
          component.types.includes("locality")
        );

        /*   console.log(results[0]); */
        /*      console.log(addressComponents);
        console.log(street); */
        /*        console.log(barangay); */
        /*     console.log(municipality); */
        if (street && municipality) {
          const streetName = street.long_name;
          /*     const barangayName = barangay.long_name; */
          const municipalityName = municipality.long_name;
          callback(streetName, municipalityName);
        } else {
          console.log("Street, barangay, or municipality name not found");
        }
      } else {
        console.log("No results found");
      }
    } else {
      console.log("Geocoding failed. Status:", status);
    }
  });
};
