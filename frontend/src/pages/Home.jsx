import { useEffect, useState } from "react";

import { request } from "../utils/axios";

import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import { getServerResponse } from "../redux/serverResponseSlice";
import { useSelector, useDispatch } from "react-redux";
import Pusher from "pusher-js";

import Navbar from "../components/Navbar";

function Home() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const [signal, setSignal] = useState(null);
  const [weather, setWeather] = useState(null);
  const { serverResponse } = useSelector((state) => state.serverResponse);
  const [pusherMessage, setPusherMessage] = useState("");
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

  /* pusher */
  /*   REACT_APP_APP_ID = "1614935"
  REACT_APP_KEY = "83ffcdeb54b7ffa56946"
  REACT_APP_SECRET = "0844c188d0d0bf89aee3"
  REACT_APP_CLUSTER = "ap1"
   */
  //receive
  useEffect(() => {
    const pusher = new Pusher(process.env.REACT_APP_KEY, {
      cluster: process.env.REACT_APP_CLUSTER,
    });

    const channel = pusher.subscribe("sagipChannel");
    channel.bind("sagipEvent", (data) => {
      console.log("Received event:", data);
      if (data.to === user.id && data.purpose === "notification") {
        alert(
          "akin itong notifcation, my notification use effect should be reloaded, toast should appear"
        );
      }
      /*  if (data.to === user.id) {
        alert("akin to");
      } */
      if (data.purpose === "reload") {
        alert("reload use effect");
      }
    });
    return () => {
      pusher.unsubscribe("sagipChannel");
    };
  }, []);

  const triggerPusher = async () => {
    setPusherMessage("Pusher Test");
    await request(
      "/api/pusher",
      "PUT",
      {
        Authorization: `Bearer ${token}`,
      },
      {
        //maglalagay ng reload pag magsusubmit ng hazard report, emergency help, pwede din sa verification
        //receive reload sa dashabord manage report hazard at verification

        //notification || reload || location"
        //notification poag spedicif person

        //location pag share resder location
        pusherTo: "648070cf9a74896d21b7d494", //required pag notifc
        purpose: "reload", //required sa lahat
        content: {
          latitude: 14.8527, //required pag location long lat
          longitude: 120.816, //required pag notifc pwede lagyan message
        },
      }
    );
  };
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
      <br></br>
      <br></br>
      <br></br>

      <div>PUSHER API TEST</div>
      <div>
        <h1>Pusher Test</h1>
        <button onClick={triggerPusher}>Trigger Event</button>
      </div>
      <br></br>
    </>
  );
}

export default Home;
