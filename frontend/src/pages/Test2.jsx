import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { request } from "../utils/axios";
import { toast } from "react-toastify";

function VerifyIdentity() {
  const navigate = useNavigate();
  const [selfieImage, setSelfieImage] = useState(null);
  const { token, user } = useSelector((state) => state.auth);
  const [alreadyRequested, setAlreadyRequested] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    console.log(user);

    const fetchAccountDetails = async () => {
      try {
        const options = {
          Authorization: `Bearer ${token}`,
        };
        const data = await request(
          `/auth/verify-identity/request/${user.id}`,
          "GET",
          options
        );

        console.log(data);

        if (data.success) {
        } else {
          if (data.message.includes("not found")) {
            navigate("/");
          }
          if (data.message.includes("pending")) {
            // pag may request na
            setAlreadyRequested(true);
          }
        }

        if (data.status === "verified") {
          navigate("/");
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchAccountDetails();
  }, [token, user]);

  const startCamera = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      })
      .catch((error) => {
        console.error("Error accessing the camera: ", error);
      });
  };

  const stopCamera = () => {
    if (streamRef.current) {
      const stream = streamRef.current;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsRecording(false);
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      setSelfieImage(blob);
    }, "image/png");
  };

  const startRecording = () => {
    if (streamRef.current && !mediaRecorderRef.current) {
      const stream = streamRef.current;
      const options = { mimeType: "video/webm" };
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.addEventListener("dataavailable", handleDataAvailable);
      mediaRecorder.addEventListener("stop", handleStop);

      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]);
      setIsRecording(true);
      mediaRecorder.start();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleDataAvailable = (event) => {
    if (event.data.size > 0) {
      setRecordedChunks((prevChunks) => [...prevChunks, event.data]);
    }
  };

  const handleStop = () => {
    const recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
    setSelfieImage(recordedBlob);
    mediaRecorderRef.current = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    if (selfieImage) {
      formData.append("selfieImage", selfieImage, "selfie.png");
    }

    try {
      const options = { Authorization: `Bearer ${token}` };
      const data = await request(
        `/auth/verify-identity`,
        "PUT",
        options,
        formData
      );

      console.log(data);
      const { success, message } = data;

      if (success) {
        toast.success(message);
        return;
      } else {
        if (message !== "input error") {
          toast.error(message);
          // navigate(0);
        } else {
          toast.error(message);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      {alreadyRequested ? (
        <>We are verifying your request...</>
      ) : (
        <>
          <h2>Verify Identity</h2>
          <button onClick={startCamera}>Start Camera</button>
          <button onClick={stopCamera}>Stop Camera</button>
          <button onClick={captureImage}>Capture Image</button>
          <button onClick={startRecording}>Start Recording</button>
          <button onClick={stopRecording}>Stop Recording</button>
          <video ref={videoRef} autoPlay playsInline />
          {selfieImage && typeof selfieImage !== "string" ? (
            <video
              src={URL.createObjectURL(selfieImage)}
              alt="Recorded video"
              controls
            />
          ) : (
            <img
              src={selfieImage}
              alt="Captured selfie"
              width="200"
              height="150"
            />
          )}
          <button type="submit" onClick={handleSubmit}>
            Submit
          </button>
        </>
      )}
    </div>
  );
}

export default VerifyIdentity;
