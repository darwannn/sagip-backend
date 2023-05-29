import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
} from '@react-google-maps/api'
import { useRef, useState } from 'react'


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
function EmergencyFacility() {
  const mapAPI = process.env.REACT_APP_MAP_API;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: mapAPI,
    libraries: ['places'],
  })

  const [map, setMap] = useState(/** @type google.maps.Map */ (null))
  const [directionsResponse, setDirectionsResponse] = useState(null)
  const [distance, setDistance] = useState('')
  const [duration, setDuration] = useState('')
  const [steps, setSteps] = useState([])
  const [markerLatLng, setMarkerLatLng] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

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
  
    setMarkerLatLng({ latitude, longitude });
  }
  
  async function calculateRoute() {
    if (originRef.current.value === '' || destiantionRef.current.value === '') {
      return
    }
    // eslint-disable-next-line no-undef
    const directionsService = new google.maps.DirectionsService()
    const results = await directionsService.route({
      origin: originRef.current.value,
      destination: destiantionRef.current.value,
      // eslint-disable-next-line no-undef
      travelMode: google.maps.TravelMode.DRIVING,
    })
    setDirectionsResponse(results)
    setDistance(results.routes[0].legs[0].distance.text)
    setDuration(results.routes[0].legs[0].duration.text)
    setSteps(results.routes[0].legs[0].steps)
    
    console.log(results);
  }

  function clearRoute() {
    setDirectionsResponse(null)
    setDistance('')
    setDuration('')
    originRef.current.value = ''
    destiantionRef.current.value = ''
  }

  function getCurrentLocation() {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true, 
      
      };
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude,  longitude } = position.coords;
          setUserLocation({ lat:latitude, lng:longitude });
       console.log(latitude);
       console.log(longitude);
      // Fly to marker location with animation
    map.panTo({ lat:latitude, lng:longitude  });
  
        },
        error => {
          console.log('Error getting current location:', error);
        }, options
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
      }}
    >
      <div>
        {steps.map((step, index) => (
          <div key={index}>
            <div>{step.duration.text}</div>
            <div>{step.distance.text}</div>
            <div dangerouslySetInnerHTML={{ __html: step.instructions }} />
            <br />
          </div>
        ))}
      </div>

      {/* Display the marker's latitude and longitude */}
      {markerLatLng && (
        <div>
          Latitude: {markerLatLng.latitude}
          <br />
          Longitude: {markerLatLng.longitude}
        </div>
      )}

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
          onLoad={map => setMap(map)}
        >

{userLocation&& <Marker position={userLocation} onClick={(marker) => handleMarkerClick(marker)} />}
        {/*   <Marker position={center} onClick={(marker) => handleMarkerClick(marker)} /> */}

          {directionsResponse && (
            <DirectionsRenderer directions={directionsResponse} />
          )}
        </GoogleMap>
      </div>
      <div
        style={{
          padding: 16,
          borderRadius: 'lg',
          margin: 16,
          backgroundColor: 'white',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          minWidth: 'container.md',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Autocomplete
            bounds={bounds}
            restrictions={restrictions}
            options={{
              strictBounds: true,
            }}
          >
            <input type='text' placeholder='Origin' ref={originRef} />
          </Autocomplete>
          <Autocomplete
            bounds={bounds}
            restrictions={restrictions}
            options={{
              strictBounds: true,
            }}
          >
            <input
              type='text'
              placeholder='Destination'
              ref={destiantionRef}
            />
          </Autocomplete>

          <div>
            <button style={{ backgroundColor: 'pink', color: 'white', padding: '8px 16px' }} type='submit' onClick={calculateRoute}>
              Calculate Route
            </button>
            <button style={{ marginLeft: 8 }} onClick={clearRoute}>
              Clear Route
            </button>
            <button style={{ marginLeft: 8 }} onClick={getCurrentLocation}>
              Get Current Location
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>Distance: {distance}</div>
          <div>Duration: {duration}</div>
          <button
            style={{ borderRadius: '50%', width: 32, height: 32, backgroundColor: 'lightblue' }}
            onClick={() => {
              map.panTo(center)
              map.setZoom(15)
            }}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M21 12H3M21 12L15 16M21 12L15 8'></path>
            </svg>
          </button>
        </div>

        {/* Display the steps */}
        <div>
          {steps.map((step, index) => (
            <div key={index}>
              <div >{step.duration.text}</div>
              <div>{step.distance.text}</div>
              <div dangerouslySetInnerHTML={{ __html: step.instructions }} />
              <br></br>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EmergencyFacility
