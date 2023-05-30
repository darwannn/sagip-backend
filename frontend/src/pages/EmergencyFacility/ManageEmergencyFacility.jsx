import { useEffect, useState,useRef } from 'react';

import { useParams, useNavigate, Link } from 'react-router-dom';

import { useSelector } from 'react-redux';

import { request } from '../../utils/axios';
import { emergencyFacilityCategory } from '../../utils/categories';

import { toast } from 'react-toastify';
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
  StandaloneSearchBox
} from '@react-google-maps/api'

import {
  AiFillDelete,
  AiOutlineArrowRight,
  AiOutlineCloseCircle,
} from 'react-icons/ai';
import Navbar from '../../components/Navbar';

const libraries = ['places'];
const center = { lat: 14.8448, lng: 120.8103 }
const bounds = {
  north: 14.881784,  
  south: 14.795797,  
  east: 120.855111,   
  west: 120.781636,   
};

const restrictions = {
  country: 'ph',
}



const ManageEmergencyFacility = () => {


  
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  
  const [emergencyFacility, setEmergencyFacility] = useState([]);
  const [filteredEmergencyFacility, setFilteredEmergencyFacility] = useState([]);
  const [activeCategory, setActiveCategory] = useState(emergencyFacilityCategory[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [shouldFetchData, setShouldFetchData] = useState(true);

  /* _________ */
  const [type, setType] = useState('');
  const [isModalShown, setisModalShown] = useState(false);

  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isFull, setIsFull] = useState(false);

  const [hasChanged, setHasChanged] = useState(false);


  const mapAPI = process.env.REACT_APP_MAP_API;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: mapAPI,
    libraries,
  })

  const [map, setMap] = useState(/** @type google.maps.Map */ (null))
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
      const center = new  window.google.maps.LatLng(lat(), lng());
      map.panTo(center);
    }
  };

  const onSBLoad = ref => {
    setSearchBox(ref);
  };

  /* const [directionsResponse, setDirectionsResponse] = useState(null)
  const [distance, setDistance] = useState('')
  const [duration, setDuration] = useState('')
  const [steps, setSteps] = useState([])
  const [markerLatLng, setMarkerLatLng] = useState(null);
  const [userLocation, setUserLocation] = useState(null); */


  useEffect(() => {
    const fetchEmergencyFacility = async () => {
      try {
        const data = await request('/emergency-facility/', 'GET');
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
    if (activeCategory === emergencyFacilityCategory[0]) {
      setFilteredEmergencyFacility(
        emergencyFacility.filter((emergencyFacility) =>
          emergencyFacility.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredEmergencyFacility(
        emergencyFacility.filter(
          (emergencyFacility) =>
            emergencyFacility.category.toLowerCase() === activeCategory.toLowerCase() &&
            emergencyFacility.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [activeCategory, searchQuery, emergencyFacility]);

  useEffect(() => {
    if (id) {
      const fetchSafetyTipDetails = async () => {
        try {
          const options = {
            Authorization: `Bearer ${token}`,
          };
          const data = await request(`/emergency-facility/${id}`, 'GET', options);
          console.log('====================================');
          console.log(data);
          console.log('====================================');
          if (data.message !== 'not found') {
            setName(data.name);
            setLatitude(data.latitude);
            setLongitude(data.longitude);
            setIsFull(data.isFull);
            setCategory(data.category);
             setMarkerLatLng({ lat:data.latitude, lng:data.longitude });
            setImageUrl(`http://localhost:5000/images/${data.image}`);
          } else {
            navigate(`/manage/emergency-facility`);
          }
        } catch (error) {
          console.error(error);
        }
      };

      setisModalShown(true);
      setType("update");
      fetchSafetyTipDetails();
    } else {
      setisModalShown(false);
      setMarkerLatLng(null)
    }
  }, [id, setName, setLatitude, setCategory, token]);

  
  /* _________ */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('category', category);
      formData.append('hasChanged', hasChanged);
      formData.append('image', image);

      const options = {
        Authorization: `Bearer ${token}`,
      };

      let url, method;
      if (type === 'add') {
        url = '/emergency-facility/add';
        method = 'POST';
      } else if (type === 'update') {
        formData.append('isFull', isFull);

        url = `/emergency-facility/update/${id}`;
        method = 'PUT';
      }
     
      const data = await request(url, method, options, formData, true);

      console.log(data);

      const { success, message } = data;
      if (success) {
        toast.success(message);
        navigate(`/manage/emergency-facility`);
        setisModalShown(false);
        setShouldFetchData(true);
      } else {
        if (message !== 'input error') {
          toast.error(message);
        } else {
          toast.error(message);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteEmergencyFacility = async () => {
    try {
      const options = { Authorization: `Bearer ${token}` };
      const data = await request(`/emergency-facility/delete/${id}`, 'DELETE', options);
      const { message } = data;
      toast.success(message);
      navigate(`/manage/emergency-facility`);
    } catch (error) {
      console.error(error);
    }
  };

  /* repeated */
  const onChangeFile = (e) => {
    setImage(e.target.files[0]);
    setImageName(e.target.files[0].name);
    setHasChanged(true);
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result);
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleCloseImage = () => {
    setImage(null);
    setImageName('');
    setImageUrl('');
  };







    /** @type React.MutableRefObject<HTMLInputElement> */
    const originRef = useRef()
    /** @type React.MutableRefObject<HTMLInputElement> */
    const destiantionRef = useRef()
  
    if (!isLoaded) {
      return "<SkeletonText />"
    }
  

    function handleMarkerClick(event) {
      const { latLng } = event;
      const latitude = latLng.lat();
      const longitude = latLng.lng();
    
      setMarkerLatLng({ lat:latitude, lng:longitude });
setLatitude(latitude)
setLongitude(longitude)
      console.log({ lat:latitude, lng:longitude });
    }


  return (
    <>
      <Navbar />
      <br />
      <br />

      <div>
        <div>
          {emergencyFacilityCategory.slice(1).map((category) => (
            <div key={category}>
              <h3>{category}</h3>
              <p>
                {emergencyFacility.filter(
                  (emergencyFacility) =>
                    emergencyFacility.category.toLowerCase() === category.toLowerCase()
                ).length}
              </p>
            </div>
          ))}
        </div>
      </div>
     
      <div
      style={{
        position: 'relative',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
      }}
    >
     

      <div style={{  height: '50%', width: '100%' }}>
        {/* Google Map Box */}
        <GoogleMap
          center={center}
          zoom={15}
          mapContainerStyle={{ width: '100%', height: '100%' }}
          options={{
           /*  restriction: {
              latLngBounds: bounds,
              strictBounds: true,
            }, */
            zoomControl: true,
            streetViewControl: true,
            mapTypeControl: true,
            fullscreenControl: false,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [
                  {
                    visibility: 'off',
                  },
                ],
              },
            ],
          }}
          onLoad={map => {
            mapRef.current = map;
          }}
          onClick={handleMarkerClick}
        >

      {markerLatLng && <Marker position={markerLatLng}     draggable={true}
              onDragEnd={handleMarkerClick}/>}
            <StandaloneSearchBox
            onPlacesChanged={onPlacesChanged}
            onLoad={onSBLoad}
          >
            <input
              type="text"
              placeholder="Customized your placeholder"
              style={{
                boxSizing: 'border-box',
                border: `1px solid transparent`,
                width: `270px`,
                height: `40px`,
                padding: `0 12px`,
                borderRadius: `3px`,
                boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
                fontSize: `14px`,
                outline: `none`,
                margin: 'center',
                textOverflow: `ellipses`,
                position: 'absolute',
                top: '40px',
                marginLeft: '50%'
              }}
            />
          </StandaloneSearchBox>
        </GoogleMap>
      
      </div>
   
    </div>
      <br />
      <br />
      <Link
        to="/manage/emergency-facility/add"
        onClick={() => {
          setisModalShown(true);
          setType('add');
        }}
      >
        Add
      </Link>

      <div>
        <input
          type="text"
          placeholder="Search emergencyFacility"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div>
        {emergencyFacilityCategory.map((category) => (
          <span
            style={{ margin: '10px' }}
            key={category}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </span>
        ))}
      </div>
      {filteredEmergencyFacility.length > 0 ? (
        <div>
          {filteredEmergencyFacility.map((emergencyFacility) => (
            <Link to={`/manage/emergency-facility/${emergencyFacility._id}`} key={emergencyFacility._id}>
              <div>
                <div>
                  <span> {emergencyFacility.name}</span>
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

      {isModalShown && (
        <>
          <div>
            <div>
              <Link to="/manage/emergency-facility">
                Go Back <AiOutlineArrowRight />
              </Link>
              <h2>{type} SafetyTip</h2>
              <form onSubmit={handleSubmit} encType="multipart/form-data">
                <div>
                  <AiFillDelete onClick={handleDeleteEmergencyFacility} />
                </div>
                <div>
                  <label>Title: </label>
                  <input
                    type="text"
                    placeholder="name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label>latitude: </label>
                  <div>{latitude}</div>
                 {/*  <input
                    type="text"
                    placeholder="latitude..."
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  /> */}
                </div>
                <div>
                  <label>longitude: </label>
                  <div>{longitude}</div>
                 {/*  <input
                    type="text"
                    placeholder="longitude..."
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  /> */}
                </div>
                <div>
                  {type == "update"&& 
                     <div>
                  <label>isFUll</label>
                  <input type="checkbox" onChange={(e) => setIsFull(e.target.checked)} checked={isFull}/>
                  </div>
                  
                  }
                  
                  
                  <label>Category: </label>
                  <select onChange={(e) => setCategory(e.target.value)}>
                    <option value="" hidden>
                      Select a category
                    </option>
                    {emergencyFacilityCategory.slice(1).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="image">
                    Image: <span>Upload here</span>
                  </label>
                  <input id="image" type="file" onChange={onChangeFile} />
                  {image && (
                    <p>
                      {imageName} <AiOutlineCloseCircle onClick={() => handleCloseImage()} />
                    </p>
                  )}

                  {imageUrl && <img src={imageUrl} alt="Selected" height={"100px"}/>}
                </div>
                <div>
                  <button type="submit">Submit form</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ManageEmergencyFacility;
