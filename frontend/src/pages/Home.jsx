import { request } from "../utils/axios";

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { getServerResponse } from "../redux/serverResponseSlice";
import { useSelector, useDispatch } from "react-redux";

import Navbar from "../components/Navbar";
function Home() {
  const dispatch = useDispatch();

  const [signal, setSignal] = useState(null);
  const [weather, setWeather] = useState(null);
  const { serverResponse } = useSelector((state) => state.serverResponse);
  useEffect(() => {
    const fetchData = async () => {
      //get server response
      if (serverResponse !== "") {
        toast.success(serverResponse);
        dispatch(getServerResponse());
      }
      try {
        const signalResponse = await request("/api/signal", "GET");
        setSignal(signalResponse.signal);
        const weatherResponse = await request("/api/weather", "GET");
        setWeather(weatherResponse.weather);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <Navbar />
      <div>
        Malolos Signal NUmber <br></br>
        {signal && <div>{signal}</div>}
      </div>

      <br></br>
      <br></br>

      <div>
        Malolos Weather <br></br>
        {weather && <div>{weather}</div>}
      </div>

      <Link to="/register">Register</Link>
    </>
  );
}

export default Home;
