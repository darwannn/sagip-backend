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
  const { serverResponse } = useSelector((state) => state.serverResponse);
  const [signal, setSignal] = useState(null);
  const [weather, setWeather] = useState(null);
  const [pusherMessage, setPusherMessage] = useState("");
  const [wellnessSurveys, setWellnessSurveys] = useState();
  /*   const [userAnswers, setUserAnswers] = useState([]); */
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Get server response
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
    const pusher = new Pusher(process.env.REACT_APP_KEY, {
      cluster: process.env.REACT_APP_CLUSTER,
    });

    const channel = pusher.subscribe("sagipChannel");
    channel.bind("sagipEvent", (data) => {
      console.log("Received event:", data);
      if (data.to === user.id && data.purpose === "notification") {
        alert("I received a notification");
      }
      if (data.purpose === "reload") {
        alert("Reload useEffect");
      }
    });

    return () => {
      pusher.unsubscribe("sagipChannel");
    };
  }, [user.id]);

  const triggerPusher = async () => {
    setPusherMessage("Pusher Test");
    await request(
      "/api/pusher",
      "PUT",
      {
        Authorization: `Bearer ${token}`,
      },
      {
        pusherTo: "648070cf9a74896d21b7d494",
        purpose: "reload",
        content: {
          latitude: 14.8527,
          longitude: 120.816,
        },
      }
    );
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
      <div>PUSHER API TEST</div>
      <div>
        <h1>Pusher Test</h1>
        <button onClick={triggerPusher}>Trigger Event</button>
      </div>
      <br />
      <a href="tel:09999999999">PHONE_NUM</a>
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
