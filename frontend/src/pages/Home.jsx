import React, { useEffect, useState } from 'react';
import { request } from '../utils/axios';
function Home() {
  const [signal, setSignal] = useState(null);
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const signalResponse = await request('/api/signal','GET');
        setSignal(signalResponse.signal); 
        const weatherResponse = await request('/api/weather','GET');
        setWeather(weatherResponse.weather); 
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <>
    <div>Signal NUmber in Malolos <br></br>
      {signal && <div>{signal}</div>}
    </div>

    <br></br>
    <br></br>

    <div>Malolos Weather <br></br>
      {weather && <div>{weather}</div>}
    </div>
    </>
  );
}

export default Home;
