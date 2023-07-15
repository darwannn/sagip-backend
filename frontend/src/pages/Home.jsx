import { useEffect, useState } from "react";
import { request } from "../utils/axios";
import { Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { getServerResponse } from "../redux/serverResponseSlice";
import { useSelector, useDispatch } from "react-redux";
import Pusher from "pusher-js";
import Navbar from "../components/Navbar";
import { receivePusher } from "../utils/functions";

import warningSound from "../assets/warning.mp3";
import image from "../assets/hospital_icon.png";

function Home() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const { serverResponse } = useSelector((state) => state.serverResponse);
  const [signal, setSignal] = useState(null);
  const [weather, setWeather] = useState(null);
  const [pusherMessage, setPusherMessage] = useState("");
  const [wellnessSurveys, setWellnessSurveys] = useState();
  const [isAnswered, setIsAnswered] = useState(false);
  const [intervalId, setIntervalId] = useState(null); // Added intervalId state

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission()
        .then((permission) => {
          if (permission === "granted") {
            const notificationOptions = {
              body: "Hello",
              icon: "/path/to/notification-icon.png",
            };

            const notification = new Notification("Title", notificationOptions);

            const duration = 5000;
            setTimeout(() => {
              notification.close();
            }, duration);
          }
        })
        .catch((error) => {
          console.error("Error requesting notification permission:", error);
        });
    } else {
      console.log("Notifications not supported");
    }
    const fetchData = async () => {
      if (serverResponse !== "") {
        toast.success(serverResponse);

        dispatch(getServerResponse());
      }
      try {
        const signalResponse = await request("/api/signal", "GET");
        setSignal(signalResponse.signal);
        const weatherResponse = await request("/api/weather", "GET");
        const weatherResponse1 = await request(
          "/account/fcm",
          "PUT",
          {},
          { identifier: "darwinsanluis.ramos214@gmail.com", fcmToken: "11" }
        );
        console.log(weatherResponse1);
        setWeather(weatherResponse.weather);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [serverResponse, dispatch]);

  useEffect(() => {
    const fetchWellnessSurveys = async () => {
      try {
        const data = await request("/wellness-survey/active", "GET", {
          Authorization: `Bearer ${token}`,
        });

        console.log(data);
        if (data.success) {
          setWellnessSurveys(data);
        } else {
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchWellnessSurveys();
  }, []);

  useEffect(() => {
    // const pusher = new Pusher(process.env.REACT_APP_KEY, {
    //   cluster: process.env.REACT_APP_CLUSTER,
    // });

    // const channel = pusher.subscribe("64788dfd295e2f184e55d20f");
    // channel.bind("notification", (data) => {
    //   console.log("Received event:", data);

    //   toast.success("I received a notification" + location.pathname);

    //   // if (data.purpose === "reload") {
    //   //   alert("Reload useEffect");
    //   // }
    // });

    // return () => {
    //   pusher.unsubscribe("sagipChannel");
    // };

    receivePusher("64788dfd295e2f184e55d20f", "notification", (data) => {
      // console.log("Received data:", data);
      //if (location.pathname === "/register") {
      if (data.content) {
        console.log(data.content);
        toast.success("I received a notification" + location.pathname);
      }
      if (data.purpose === "reload") {
        alert("Reload useEffect");
      }
      //  }
    });

    receivePusher("emergency-facility", "reload", (data) => {
      toast.success("emergency-facility reload");
    });
    receivePusher("wellness-survey", "reload", (data) => {
      toast.success("wellness-survey reload");
    });
    receivePusher("verification-request-web", "reload", (data) => {
      toast.success("reload table request");
    });
    receivePusher("verification-request-mobile", "reload", (data) => {
      toast.success("reload-user request");
    });
    receivePusher("assistance-request-web", "reload", (data) => {
      toast.success("assistance-request-web");
    });
    receivePusher("assistance-request-mobile", "reload", (data) => {
      toast.success("assistance-request-mobile");
    });
    receivePusher("hazard-report-web", "reload", (data) => {
      toast.success("hazard-report-web");
    });
    receivePusher("hazard-report-mobile", "reload", (data) => {
      toast.success("hazard-report-mobile");
    });
    receivePusher("account", "reload", (data) => {
      toast.success("accoutn reload");
    });
    receivePusher(user.id, "reload", (data) => {
      toast.success("user reload");
    });
  }, []);

  const triggerPusher = async () => {
    /*    setPusherMessage("Pusher Test"); */

    console.log("triggerPusher");

    const data = await request(
      "/api/pusher",
      "PUT",
      {
        Authorization: `Bearer ${token}`,
      },
      {
        event: "notification",
        channel: "64788dfd295e2f184e55d20f",
        content: {
          latitude: 14.8527,
          longitude: 120.816,
        },
      }
    );
    console.log("=============pusher data =======================");
    console.log(data);
    console.log("====================================");
  };

  const handleMouseDown = () => {
    const interval = setInterval(function () {
      //window.AndroidInterface?.vibrateOnHold();
      console.log("====================================");
      console.log("S");
      console.log("====================================");
      if (window.AndroidInterface) {
        window.AndroidInterface.vibrateOnHold();
      } else {
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
      }
    }, 100);
    setIntervalId(interval);
  };

  const handleMouseUp = () => {
    console.log("====================================");
    console.log("sfdfs");
    console.log("====================================");
    clearInterval(intervalId);
  };

  let audioRef;
  const playSound = async () => {
    audioRef = new Audio(warningSound);
    audioRef.loop = true;
    audioRef.play();
  };

  const stopSound = () => {
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }
  };

  const answerSurvey = async (surveyId, answer) => {
    try {
      const data = await request(
        "/wellness-survey/answer",
        "PUT",
        {
          Authorization: `Bearer ${token}`,
        },
        {
          surveyId: surveyId,
          answer: answer,
        }
      );
      const { success, message } = data;
      if (success) {
        toast.success(message);
        setIsAnswered(true);
      } else {
        toast.error(message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Navbar />
      <div>
        User: {user && user.id}
        {/*   {user&& user.firstname} */}
      </div>
      <div>
        Malolos Signal Number:
        <br />
        {signal && <div>{signal}</div>}
      </div>
      <br />
      <br />
      <div>
        Malolos Weather:
        <br />
        {weather && <div>{weather}</div>}
      </div>
      <Link to="/register">Register</Link>
      <br />
      <br />
      <br />
      <div>PUSHER API TESTT</div>
      <div>
        <Link to={`/map`}>register</Link>
        <h1>Pusher Test</h1>
        <button onClick={triggerPusher}>Trigger Event</button>
      </div>
      <div>
        <button onTouchStart={handleMouseDown} onTouchEnd={handleMouseUp}>
          Vibrate on Hold
        </button>
        <br />
        {/*   <button onClick={() => window.AndroidInterface?.vibrateOnHold()}>
          Vibrate cLICK
        </button> */}
        <br />
        <br />
        <br />
        <button onClick={playSound}>Play Sound</button>
        <button onClick={() => window.AndroidInterface?.("camcorder")}>
          {/* window.AndroidInterface?.vibrateOnHold(); */}
          Test
        </button>
        <br />
        <button onClick={stopSound}>Stop Sound</button>
      </div>
      <br />
      <a href="tel:09999999999">PHONE_NUMMn</a>
      <input
        type="file"
        accept="image/*"
        capture="camera"
        onClick={() => window.AndroidInterface?.setMediaChooser("camera")}
      ></input>
      <input
        type="file"
        accept="image/*"
        capture="camcorder"
        onClick={() => window.AndroidInterface?.setMediaChooser("camcorder")}
      ></input>
      <input
        type="file"
        accept="image/*"
        onClick={() => window.AndroidInterface?.setMediaChooser("file")}
      ></input>
      <>
        {wellnessSurveys && (
          <>
            {true ? (
              <>
                <button
                  onClick={() => answerSurvey(wellnessSurveys._id, "affected")}
                >
                  affected
                </button>
                <button
                  onClick={() =>
                    answerSurvey(wellnessSurveys._id, "unaffected")
                  }
                >
                  unaffected
                </button>
              </>
            ) : null}
          </>
        )}
      </>
    </>
  );
}

export default Home;
