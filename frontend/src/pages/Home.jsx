import React, { useEffect, useState } from 'react';
import { request } from '../utils/fetchApi';
function Home() {
  const [signal, setSignal] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await request('/api/signal','GET');
        setSignal(response.signal); 
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>Signal NUmber in Malolos <br></br>
      {signal && <div>{signal}</div>}
    </div>
  );
}

export default Home;
