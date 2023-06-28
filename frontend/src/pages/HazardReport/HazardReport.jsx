import { useState, useEffect, useRef } from "react";

import { Link, useParams, useNavigate } from "react-router-dom";

import { useSelector } from "react-redux";

import { request } from "../../utils/axios";
import { hazardCategory } from "../../utils/categories";
import { reverseGeoCoding } from "../../utils/functions";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
  StandaloneSearchBox,
} from "@react-google-maps/api";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import { AiOutlineCloseCircle } from "react-icons/ai";

import Navbar from "../../components/Navbar";

/* outside function */
const libraries = ["places"];

const defaultCenter = { lat: 14.8448, lng: 120.8103 };
const malolosBounds = {
  north: 14.881784,
  south: 14.795797,
  east: 120.855111,
  west: 120.781636,
};

const restrictions = {
  country: "ph",
};

const HazardReport = ({ type = "add" }) => {
  const { id } = useParams();

  const navigate = useNavigate();

  const { token } = useSelector((state) => state.auth);

  const mapAPI = process.env.REACT_APP_MAP_API;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: mapAPI,
    libraries,
  });

  const [map, setMap] = useState(/** @type google.maps.Map */ (null));
  const [markerLatLng, setMarkerLatLng] = useState(null);
  const [searchBox, setSearchBox] = useState(null);
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const onPlacesChanged = () => {
    const places = searchBox.getPlaces();
    if (places.length === 0) return;

    const { geometry } = places[0];
    const { location } = geometry;
    const { lat, lng } = location;

    if (mapRef.current) {
      const map = mapRef.current;
      const center = new window.google.maps.LatLng(lat(), lng());
      map.panTo(center);
    }
  };

  const onSBLoad = (ref) => {
    setSearchBox(ref);
  };

  /** @type React.MutableRefObject<HTMLInputElement> */
  const originRef = useRef();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [proof, setProof] = useState(null);
  const [proofName, setProofName] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    if (type === "update") {
      const fetchSafetyTipDetails = async () => {
        try {
          const data = await request(`/hazard-report/${id}`, "GET", {
            Authorization: `Bearer ${token}`,
          });

          setTitle(data.title);
          setDescription(data.description);
          setCategory(data.category);
          setProofUrl(
            `https://res.cloudinary.com/dantwvqrv/image/upload/v1687689617/sagip/media/safety-tips/${data.proof}`
          );
          console.log(data.category);
          console.log(category);
        } catch (error) {
          console.error(error);
        }
      };
      fetchSafetyTipDetails();
    }
  }, [type, setTitle, setDescription, setCategory, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      if (longitude && latitude) {
        const locationName = await new Promise((resolve, reject) => {
          reverseGeoCoding(latitude, longitude).then(resolve).catch(reject);
        });
        const { street, municipality } = locationName;
        formData.append("street", street);
        formData.append("municipality", municipality);
      }
      /*    if (municipality === "Malolos") { */

      formData.append("title", title);
      formData.append("description", description);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      formData.append("category", category);
      formData.append("hasChanged", hasChanged);
      formData.append("proof", proof);

      let url, method;
      if (type === "add") {
        url = "/hazard-report/add";
        method = "POST";
      } else if (type === "update") {
        url = `/hazard-report/update/${id}`;
        method = "PUT";
      }

      const data = await request(
        url,
        method,
        {
          Authorization: `Bearer ${token}`,
        },
        formData
      );
      console.log(data);

      const { success, message } = data;
      if (success) {
        toast.success(message);
      } else {
        if (message !== "input error") {
          toast.error(message);
        } else {
          toast.error(message);
        }
      }
      /*  } else { */
      /* toast.error("Unfortunately the selected area is outside Malolos"); */
      /* navigate('/') */
      /*   } */
    } catch (error) {
      console.error(error);
    }
  };

  const onChangeImage = (e) => {
    setProof(e.target.files[0]);
    setProofName(e.target.files[0].name);
    setHasChanged(true);
    const reader = new FileReader();
    reader.onload = () => {
      setProofUrl(reader.result);
    };
    reader.readAsDataURL(e.target.files[0]);
  };
  const onChangeVideo = (e) => {
    setProof(e.target.files[0]);
    setProofName(e.target.files[0].name);
    setHasChanged(true);
    const reader = new FileReader();
    reader.onload = () => {
      setProofUrl(reader.result);
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleCloseImage = () => {
    setProof(null);
    hasChanged(false);
    setProofName("");
    setProofUrl("");
  };

  if (!isLoaded) {
    return "<SkeletonText />";
  }

  function handleMarkerClick(event) {
    const { latLng } = event;
    const latitude = latLng.lat();
    const longitude = latLng.lng();

    setMarkerLatLng({ lat: latitude, lng: longitude });
    setLatitude(latitude);
    setLongitude(longitude);
    console.log({ lat: latitude, lng: longitude });
  }
  function getCurrentLocation() {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
      };
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
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
            height: "100vh",
            width: "100vw",
          }}
        >
          <div style={{ height: "50%", width: "100%" }}>
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
          <h2>{type === "add" ? "Add" : "Update"} Safety Tip</h2>
          <form onSubmit={handleSubmit} encType="multipart/form-data">
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
              <input
                type="text"
                placeholder="Description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div></div>
            <div>
              <label>Categoty: </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="" hidden>
                  Select a category
                </option>
                {hazardCategory.slice(1).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div>
                <button type="submit">Submit</button>
              </div>
              <label htmlFor="image">
                Image: <span>Upload Photo</span>
              </label>
              {/*  <input type="file" accept="image/*" capture="camera"></input> */}
              <input
                id="image"
                type="file"
                accept="image/*"
                capture="camera"
                onChange={onChangeImage}
                onClick={() =>
                  window.AndroidInterface?.setMediaChooser("camera")
                }
              />

              <label htmlFor="video">
                Video: <span>Upload Video</span>
              </label>
              <input
                id="video"
                type="file"
                accept="video/*"
                capture="camcorder"
                onChange={onChangeVideo}
                onClick={() =>
                  window.AndroidInterface?.setMediaChooser("camcorder")
                }
              />
              {/* {videoUrl && <video src={videoUrl} controls />} */}
              {/*  {proofUrl && <img src={proofUrl} />}
              {proofUrl && (
                <div>
                  {proofUrl.includes("data:image")}
                  {proofUrl}
                </div>
              )}
              {proofUrl && <video src={proofUrl} controls />} */}

              {proofUrl && proofUrl.includes("data:image") && (
                <img src={proofUrl} />
              )}
              {proofUrl && proofUrl.includes("data:video") && (
                <video src={proofUrl} controls />
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default HazardReport;
