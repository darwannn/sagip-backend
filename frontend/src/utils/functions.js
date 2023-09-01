import Pusher from "pusher-js";
import io from "socket.io-client";
const socket = io.connect("https://sagip.onrender.com/");
/* const socket = io.connect("http://localhost:5000"); */
export const reverseGeoCoding = (latitude, longitude) => {
  return new Promise((resolve, reject) => {
    const geocoder = new window.google.maps.Geocoder();
    const latlng = { lat: latitude, lng: longitude };

    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === "OK") {
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

          resolve({
            street: `${streetNumber} ${streetName}`,
            municipality: municipalityName,
          });
        } else {
          reject(new Error("No results found"));
        }
      } else if (status === "ZERO_RESULTS") {
        reject(new Error("No results found"));
      } else {
        reject(new Error("Geocoding failed. Status: " + status));
      }
    });
  });
};

//di gumagana pag promise
//channel name either location, notification or reload
// event name sino mag rereceive

export const receivePusher = (eventName, callback) => {
  socket.on(eventName, (data) => {
    callback(data);
    // Update your component's state or perform other actions with the received data
  });

  // Clean up the socket connection on unmount
  return () => {
    socket.disconnect();
  };
};
/* export const receivePusher = (channelName, eventName, callback) => {
  const pusher = new Pusher(process.env.REACT_APP_KEY, {
    cluster: process.env.REACT_APP_CLUSTER,
  });

  const channel = pusher.subscribe(channelName);
  const eventHandler = (data) => {
    callback(data);
  };

  channel.bind(eventName, eventHandler);

  const unsubscribe = () => {
    channel.unbind(eventName, eventHandler);
    pusher.unsubscribe(channelName);
  };

  return {
    unsubscribe: () => {
      unsubscribe();
    },
  };
};
 */
