import { request } from '../utils/axios';

import { useEffect, useState } from 'react';
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
    <div>Malolos Signal NUmber <br></br>
      {signal && <div>{signal}</div>}
    </div>
    <h1 className="text-3xl font-bold underline">
      Hello world!
    </h1>
    <br></br>
    <br></br>

    <div>Malolos Weather <br></br>
      {weather && <div>{weather}</div>}
    </div>
    </>
  );
}

export default Home;
