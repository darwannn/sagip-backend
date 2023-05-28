
import { FaLocationArrow, FaTimes } from 'react-icons/fa'

import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
} from '@react-google-maps/api'
import { useRef, useState } from 'react'


const center = { lat: 48.8584, lng: 2.2945 }

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

  /** @type React.MutableRefObject<HTMLInputElement> */
  const originRef = useRef()
  /** @type React.MutableRefObject<HTMLInputElement> */
  const destiantionRef = useRef()

  if (!isLoaded) {
    return "<SkeletonText />"
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
      <div style={{  height: '50%', width: '100%' }}>
        {/* Google Map Box */}
        <GoogleMap
          center={center}
          zoom={15}
          mapContainerStyle={{ width: '100%', height: '100%' }}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
          onLoad={map => setMap(map)}
        >
          <Marker position={center} />
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
        <Autocomplete>
              <input type='text' placeholder='Origin' ref={originRef} />
            </Autocomplete>
            <Autocomplete>
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
