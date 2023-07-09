import { useState, useEffect, useRef, useCallback } from "react";

import { Link, useParams, useNavigate } from "react-router-dom";

import { useSelector } from "react-redux";

import { request } from "../../utils/axios";
import { hazardCategory } from "../../utils/categories";
import { reverseGeoCoding } from "../../utils/functions";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Webcam from "react-webcam";

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

  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [proof, setProof] = useState(null);
  const [proofpic, setProofpic] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [facingMode, setFacingMode] = useState("user");

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: facingMode,
  };

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
  const [street, setStreet] = useState("");
  const [answer, setAnswer] = useState([]);
  const [municipality, setMunicipality] = useState("");

  const [proofName, setProofName] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    /* if (type === "update") { */
    const fetchSafetyTipDetails = async () => {
      try {
        const data = await request(`/assistance-request/myrequest`, "GET", {
          Authorization: `Bearer ${token}`,
        });
        /*  const { success, message } = data;

        if (success) { */

        console.log("====================================");
        console.log(data);
        console.log("====================================");

        if (data.success === false) {
          setIsVerifying(false);
        } else {
          setIsVerifying(true);
          setLatitude(data.latitude);
          setLongitude(data.longitude);
          setTitle(data.title);
          setRequestId(data._id);
          setMunicipality(data.municipality);
          setStreet(data.street);
          setDescription(data.description);
          setCategory(data.category);

          if (data.proof.includes(".jpg")) {
            setProofpic(
              `https://res.cloudinary.com/dantwvqrv/image/upload/v1687689617/sagip/media/assistance-request/${data.proof}`
            );
          } else {
            setProofpic(
              `https://res.cloudinary.com/dantwvqrv/video/upload/v1687689617/sagip/media/assistance-request/${data.proof}`
            );
          }
          console.log("data.category");
          console.log(data);
          /* } else {
            if (message === "verifying") {
              setIsVerifying(true);
            }
          } */
        }
        setMarkerLatLng({ lat: data.latitude, lng: data.longitude });
      } catch (error) {
        console.error(error);
      }
    };
    fetchSafetyTipDetails();
    /* } */
  }, [type, setTitle, setDescription, setCategory, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const locationName = await new Promise((resolve, reject) => {
        reverseGeoCoding(latitude, longitude).then(resolve).catch(reject);
      });

      /*       setAnswer(["1", "2"]); */

      const { street, municipality } = locationName;
      /*    if (municipality === "Malolos") { */
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);
      formData.append("category", category);
      //formData.append("hasChanged", hasChanged);
      formData.append("proof", proof);
      formData.append("street", street);
      formData.append("municipality", municipality);
      formData.append("answers", ["1", "2"]);

      console.log(street);
      console.log(municipality);

      let url, method;
      if (isVerifying === false) {
        url = "/assistance-request/add";
        method = "POST";
      } else if (isVerifying === true) {
        formData.append("hasChanged", hasChanged);
        url = `/assistance-request/update/${requestId}`;
        method = "PUT";
      }
      console.log("=====hasChanged===============================");
      console.log(hasChanged);
      console.log(url);
      console.log("======isVerifying==============================");
      console.log(isVerifying);
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

  const handleStopCaptureClick = useCallback(() => {
    mediaRecorderRef.current.stop();
    setHasChanged(true);
    setCapturing(false);
  }, [mediaRecorderRef, webcamRef, setCapturing]);

  const handleStartCaptureClick = useCallback(() => {
    setHasChanged(true);
    navigator.mediaDevices
      .getUserMedia({ video: videoConstraints, audio: true })
      .then((stream) => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.addEventListener(
          "dataavailable",
          handleDataAvailable
        );
        mediaRecorderRef.current.start();

        setCapturing(true);

        setTimeout(() => {
          handleStopCaptureClick();
        }, 2000);
      })
      .catch((error) => {
        console.error("Error accessing webcam:", error);
      });
  }, [
    webcamRef,
    setCapturing,
    mediaRecorderRef,
    videoConstraints,
    handleStopCaptureClick,
  ]);

  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));

        const videoBlob = new Blob([data], { type: "video/mp4" });

        const file = new File([videoBlob], "proof.mp4", { type: "video/mp4" });
        setProof(file);
        console.log("====================================");
        console.log(file);
        console.log("====================================");
      }
    },
    [setRecordedChunks]
  );

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();

    const image = new Image();
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;

      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, image.width, image.height);

      canvas.toBlob((blob) => {
        const file = new File([blob], "proof.jpeg", { type: "image/jpeg" });
        setProof(file);
        setHasChanged(true);
      }, "image/jpeg");
    };
  }, [webcamRef]);

  const toggleFacingMode = useCallback(() => {
    setFacingMode((prevFacingMode) =>
      prevFacingMode === "user" ? "environment" : "user"
    );
  }, []);

  if (!isLoaded) {
    return "<SkeletonText />";
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
            </div>
          </form>
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              height={720}
              width={1280}
              videoConstraints={videoConstraints}
            />
            {capturing ? (
              <button onClick={handleStopCaptureClick}>Stop Capture</button>
            ) : (
              <button onClick={handleStartCaptureClick}>Start Capture</button>
            )}
            <button onClick={capture}>Capture photo</button>
            <button onClick={toggleFacingMode}>
              Toggle Camera: {facingMode === "user" ? "Back" : "Front"}
            </button>
            {proof && (
              <div>
                <h2>Proof:</h2>
                {proof.type.includes("image") ? (
                  <img src={URL.createObjectURL(proof)} alt={proof.name} />
                ) : (
                  <video src={URL.createObjectURL(proof)} controls />
                )}
                <p>File Name: {proof.name}</p>
              </div>
            )}
            {proofpic && (
              <div>
                <h2></h2>
                {proofpic.includes(".jpg") ? (
                  <img src={proofpic} />
                ) : (
                  <video src={proofpic} controls />
                )}
              </div>
            )}
          </>
        </div>
      </div>
    </>
  );
};

export default HazardReport;
