import { useState, useEffect, useRef } from "react";

import { Link, useParams, useNavigate } from "react-router-dom";

import { useSelector } from "react-redux";

import { request } from "../utils/axios";
import { hazardCategory } from "../utils/categories";
import { reverseGeoCoding } from "../utils/functions";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer, // generate route lang
  StandaloneSearchBox,
} from "@react-google-maps/api";

import "react-quill/dist/quill.snow.css";

import Navbar from "../components/Navbar";

/* dapat nasa labas ng  function */
const libraries = ["places"];

const defaultCenter = { lat: 14.8448, lng: 120.8103 }; //

//para malimit yung view sa malolos, need pa ata iadjust yung bounds, di ko alam mga lugar sa malolos
const malolosBounds = {
  north: 14.881784,
  south: 14.795797,
  east: 120.855111,
  west: 120.781636,
};

//restrict yung search sa ph.
// may nilagay na din akong code sa standalone search box para ma restrict yung search result sa malolos pero di gumagana (pero gumagana yon sa Autocomplete).
const restrictions = {
  country: "ph",
};

const HazardReport = ({ type = "add" }) => {
  const mapAPI = process.env.REACT_APP_MAP_API;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: mapAPI,
    libraries,
  });

  const [markerLatLng, setMarkerLatLng] = useState(null);
  const [searchBox, setSearchBox] = useState(null);
  const mapRef = useRef(null);

  //mag papan dun sa sinearch sa input field
  const onPlacesChanged = () => {
    const places = searchBox.getPlaces();
    if (places.length === 0) return;

    const { geometry } = places[0];
    const { location } = geometry;
    const { lat, lng } = location;

    if (mapRef.current) {
      const map = mapRef.current;
      //pwedeng google.maps.LatLng... lang pero nag eerror sakin kaya nilagyan ko ng new window
      const center = new window.google.maps.LatLng(lat(), lng());
      map.panTo(center);
    }
  };

  const onSBLoad = (ref) => {
    setSearchBox(ref);
  };

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      //naka promise yung reverseGeoCoding function,

      const locationName = await new Promise((resolve, reject) => {
        reverseGeoCoding(latitude, longitude).then(resolve).catch(reject);
      });

      //backend request
    } catch (error) {
      console.error(error);
    }
  };

  //it yung lalabas habang di pa nagloload yung map, pag nilalagay to sa taas ng mga useEffect nag eerror
  if (!isLoaded) {
    return "";
  }

  //nilalagay yung long lat value sa div, tapos minamark sa map
  function handleMarkerClick(event) {
    const { latLng } = event;
    const latitude = latLng.lat();
    const longitude = latLng.lng();

    setMarkerLatLng({ lat: latitude, lng: longitude });
    setLatitude(latitude);
    setLongitude(longitude);
    console.log({ lat: latitude, lng: longitude });
  }

  //gumamit pa ng geolocation api dito pero wala nang iiimport, wala kasi yung google api
  //mamamark sa map yung location, di daw talaga accurate pag sa laptop maliban kung may built in gps din kagaya sa cellphone
  function getCurrentLocation() {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
      };
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          console.log(latitude);
          console.log(longitude);

          setLatitude(latitude);
          setLongitude(longitude);
        },
        (error) => {
          console.log("Error getting current location:", error);
        },
        options
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }
  return (
    <>
      <Navbar />
      <div>
        <div
          style={{
            position: "relative",
            flexDirection: "column",
            alignItems: "center",
            height: "400px",
            width: "100vw",
          }}
        >
          <button style={{ marginLeft: 8 }} onClick={getCurrentLocation}>
            Get Current Location
          </button>
          <GoogleMap
            center={defaultCenter}
            zoom={15}
            mapContainerStyle={{ width: "100%", height: "100%" }}
            options={{
              restriction: {
                latLngBounds: malolosBounds,
                strictBounds: true,
              },
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [
                    {
                      visibility: "off",
                    },
                  ],
                },
              ],
            }}
            onLoad={(map) => {
              mapRef.current = map;
            }}
            onClick={type && handleMarkerClick}
          >
            {markerLatLng && (
              <Marker
                position={markerLatLng}
                draggable={true}
                onDragEnd={handleMarkerClick}
              />
            )}

            <StandaloneSearchBox
              onPlacesChanged={onPlacesChanged}
              onLoad={onSBLoad}
              bounds={malolosBounds}
              restrictions={restrictions}
              options={{
                strictBounds: true,
              }}
              controlPosition={window.google.maps.ControlPosition.TOP_LEFT}
            >
              <input
                type="text"
                placeholder="Customized your placeholder"
                style={{
                  boxSizing: "border-box",
                  border: `1px solid transparent`,
                  width: `270px`,
                  height: `40px`,
                  padding: `0 12px`,
                  borderRadius: `3px`,
                  boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
                  fontSize: `14px`,
                  outline: `none`,
                  margin: "center",
                  textOverflow: `ellipses`,
                  position: "absolute",
                  top: "40px",
                  marginLeft: "50%",
                }}
              />
            </StandaloneSearchBox>
          </GoogleMap>
        </div>
      </div>
      <div>
        <Link to="/hazard">Go Back</Link>

        <form encType="multipart/form-data">
          <div>
            <div>
              <label>Latitude: </label>
              <div>{latitude}</div>
            </div>
            <div>
              <label>Longitude: </label>
              <div>{longitude}</div>
            </div>
            <label>Description: </label>
          </div>
        </form>
      </div>
    </>
  );
};

export default HazardReport;

/* const onChangeImage = (e) => {
  setProof(e.target.files[0]);
  //optional para lang makuha yung filename
  setProofName(e.target.files[0].name);
  const reader = new FileReader();
  reader.onload = () => {
    //ito yung ginamit ko para madetermine yung uploaded file type, kung ididisplay ba as image/video
    setProofUrl(reader.result);
  };
  reader.readAsDataURL(e.target.files[0]);
};
const onChangeVideo = (e) => {
  setProof(e.target.files[0]);

  setProofName(e.target.files[0].name);

  const reader = new FileReader();
  reader.onload = () => {
    setProofUrl(reader.result);
  };
  reader.readAsDataURL(e.target.files[0]);
};
 */

/* --------------------------------- */

/* pagdisplay nung proof */
/* {
  proofUrl && proofUrl.includes("data:image") && <img src={proofUrl} />;
}
{
  proofUrl && proofUrl.includes("data:video") && (
    <video src={proofUrl} controls />
  );
}
 */
