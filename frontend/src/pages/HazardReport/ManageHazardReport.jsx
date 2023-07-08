import { useEffect, useState, useRef } from "react";

import { useParams, useNavigate, Link } from "react-router-dom";

import { useSelector } from "react-redux";

import { request } from "../../utils/axios";
import { hazardReportCategory } from "../../utils/categories";
import { reverseGeoCoding } from "../../utils/functions";
import moment from "moment";
import { toast } from "react-toastify";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
  StandaloneSearchBox,
} from "@react-google-maps/api";

import {
  AiFillDelete,
  AiOutlineArrowRight,
  AiOutlineCloseCircle,
} from "react-icons/ai";
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

const ManageEmergencyFacility = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const [emergencyFacility, setEmergencyFacility] = useState([]);
  const [filteredEmergencyFacility, setFilteredEmergencyFacility] = useState(
    []
  );
  const [activeCategory, setActiveCategory] = useState(hazardReportCategory[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [shouldFetchData, setShouldFetchData] = useState(true);

  /* _________ */
  /*   const [type, setType] = useState(""); */
  const [isModalShown, setisModalShown] = useState(false);

  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [category, setCategory] = useState("");

  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [proof, setProof] = useState("");
  const [hazardStatus, setHazardStatus] = useState("");

  const [street, setStreet] = useState(null);
  const [municipality, setMunicipality] = useState("");

  const mapAPI = process.env.REACT_APP_MAP_API;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: mapAPI,
    libraries,
  });

  const [map, setMap] = useState(/** @type google.maps.Map */ (null));
  const [markerLatLng, setMarkerLatLng] = useState(null);
  const [searchBox, setSearchBox] = useState(null);
  const mapRef = useRef(null);

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

  useEffect(() => {
    const fetchEmergencyFacility = async () => {
      try {
        const data = await request("/hazard-report/", "GET");
        console.log(data);
        setEmergencyFacility(data);
        setFilteredEmergencyFacility(data);
      } catch (error) {
        console.error(error);
      }
    };

    if (shouldFetchData) {
      fetchEmergencyFacility();
      setShouldFetchData(false);
    }
  }, [shouldFetchData]);

  useEffect(() => {
    if (activeCategory === hazardReportCategory[0]) {
      setFilteredEmergencyFacility(
        emergencyFacility.filter((emergencyFacility) =>
          emergencyFacility.category
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredEmergencyFacility(
        emergencyFacility.filter(
          (emergencyFacility) =>
            emergencyFacility.status.toLowerCase() ===
              activeCategory.toLowerCase() &&
            emergencyFacility.status
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [activeCategory, searchQuery, emergencyFacility]);

  useEffect(() => {
    if (id) {
      const fetchEmergencyFacilityDetails = async () => {
        try {
          const options = {
            Authorization: `Bearer ${token}`,
          };
          const data = await request(`/hazard-report/${id}`, "GET", options);

          console.log(data);

          if (data.message !== "not found") {
            setLocation(data.userId.street);
            setAddress(data.userId.street);
            setName(data.userId.street);
            setContactNumber(data.userId.street);
            setDescription(data.description);
            setLatitude(data.latitude);
            setLongitude(data.longitude);
            setHazardStatus(data.status);
            setCategory(data.category);
            setMarkerLatLng({ lat: data.latitude, lng: data.longitude });
            if (data.proof.includes(".mp4")) {
              setProof(
                `https://res.cloudinary.com/dantwvqrv/video/upload/v1687769867/sagip/media/hazard-report/${data.proof}`
              );
            } else {
              setProof(
                `https://res.cloudinary.com/dantwvqrv/image/upload/v1687769867/sagip/media/hazard-report/${data.proof}`
              );
            }
          } else {
            navigate(`/manage/hazard-report`);
          }
        } catch (error) {
          console.error(error);
        }
      };

      setisModalShown(true);
      /*       setType("update"); */
      fetchEmergencyFacilityDetails();
    } else {
      setisModalShown(false);
      setMarkerLatLng(null);
    }
  }, [id, setName, setLatitude, setCategory, token]);

  /* _________ */

  const handleSubmit = async (type) => {
    let formData = {};
    try {
      let url, method;

      url = `/hazard-report/update/${type}/${id}`;
      method = "PUT";

      const data = await request(
        url,
        method,
        {
          Authorization: `Bearer ${token}`,
        }
        /*     { action: type } */
      );

      console.log(data);
      console.log("data");

      const { success, message } = data;
      if (success) {
        toast.success(message);
        navigate(`/manage/hazard-report`);
        setisModalShown(false);
        setShouldFetchData(true);
        setMarkerLatLng(null);
        /* setType(null); */
      } else {
        toast.error(message);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const handleDismiss = async () => {
    try {
      const options = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const data = await request(
        `/hazard-report/delete/${id}`,
        "DELETE",
        options
      );

      console.log(data);

      const { success, message } = data;
      if (success) {
        toast.success(message);
        navigate(`/manage/hazard-report`);
        setisModalShown(false);
        setShouldFetchData(true);
        setMarkerLatLng(null);
        /* setType(null); */
      } else {
        toast.error(message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /** @type React.MutableRefObject<HTMLInputElement> */
  const originRef = useRef();
  /** @type React.MutableRefObject<HTMLInputElement> */
  const destiantionRef = useRef();

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

  function checkFileType(proof) {
    // Get the file extension
    var extension = proof.split(".").pop().toLowerCase();

    // Check if it's an image file
    if (extension === "jpg" || extension === "jpeg" || extension === "png") {
      return "image";
    }
    // Check if it's a video file
    else if (extension === "mp4") {
      return "video";
    }

    // Return a default message if the file type is unsupported
    return "Unsupported file type.";
  }
  return (
    <>
      <Navbar />
      <br />
      <br />

      <div>
        <div></div>
      </div>

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
            onClick={handleMarkerClick}
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
      <br />
      <br />
      <Link
        to="/manage/hazard-report/add"
        onClick={() => {
          setisModalShown(true);
          /*    setType("add"); */
        }}
      >
        Add
      </Link>

      <div>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div>
        {hazardReportCategory.map((category) => (
          <span
            style={{ margin: "10px" }}
            key={category}
            onClick={() => {
              console.log("====================================");
              console.log(category);
              console.log("====================================");
              setActiveCategory(
                category === "review"
                  ? "unverified"
                  : category === "ongoing"
                  ? "verified"
                  : category
              );
            }}
          >
            {category}
          </span>
        ))}
      </div>
      {filteredEmergencyFacility.length > 0 ? (
        <div>
          {filteredEmergencyFacility.map((emergencyFacility) => (
            <Link
              to={`/manage/hazard-report/${emergencyFacility._id}`}
              key={emergencyFacility._id}
            >
              <div>
                <div>
                  <span>
                    {" "}
                    {moment(emergencyFacility.createdAt).format(
                      "MMMM DD, YYYY HH:mm A"
                    )}
                  </span>
                  {emergencyFacility.street}
                  {emergencyFacility.municipality}

                  <span>
                    {street}
                    {municipality}
                  </span>
                </div>
              </div>
              <br />
            </Link>
          ))}
        </div>
      ) : (
        <h3>No emergencyFacility</h3>
      )}

      <br />
      <br />
      <br />
      <br />

      {/* Create || Edit */}
      {isModalShown && (
        <>
          <div>
            <div>
              <Link to="/manage/hazard-report">Go Back</Link>
              <h2> EmergencyFacility</h2>
              {/*  <div>{name}</div>
              <div>{contactNumber}</div>
              <div>{address}</div> */}

              <div>{category}</div>
              <div>{longitude}</div>
              <div>{latitude}</div>
              <div>{location}</div>
              <div>{description}</div>

              {proof && checkFileType(proof) === "image" && (
                <img src={proof}></img>
              )}
              {proof && checkFileType(proof) === "video" && (
                <video src={proof} controls />
              )}
            </div>
            <>
              <div>
                <button
                  onClick={() => {
                    handleSubmit("verify");
                  }}
                >
                  Verify
                </button>

                <button
                  onClick={() => {
                    handleSubmit("resolve");
                  }}
                >
                  Mark as Resolved
                </button>

                <button
                  onClick={() => {
                    handleDismiss();
                  }}
                >
                  Dismiss
                </button>
              </div>

              {/* {hazardStatus !== "resolved" && (
              <div>
                {hazardStatus === "unverified" ? (
                  <button
                    onClick={() => {
                      handleSubmit("verify");
                    }}
                  >
                    Verify
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleSubmit("resolve");
                    }}
                  >
                    Mark as Resolved
                  </button>
                )}
                <button
                  onClick={() => {
                    handleDismiss();
                  }}
                >
                  Dismiss
                </button>
              </div>

            )} */}
            </>
          </div>
        </>
      )}
    </>
  );
};

export default ManageEmergencyFacility;
