import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

const Test3 = () => {
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [proof, setProof] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [facingMode, setFacingMode] = useState("user");

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: facingMode,
  };

  const handleStopCaptureClick = useCallback(() => {
    mediaRecorderRef.current.stop();
    setCapturing(false);
  }, [mediaRecorderRef, webcamRef, setCapturing]);

  const handleStartCaptureClick = useCallback(() => {
    navigator.mediaDevices
      .getUserMedia({ video: videoConstraints, audio: true })
      .then((stream) => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.addEventListener(
          "dataavailable",
          handleDataAvailable
        );
        mediaRecorderRef.current.start();

        setCapturing(true);

        setTimeout(() => {
          handleStopCaptureClick();
        }, 2000);
      })
      .catch((error) => {
        console.error("Error accessing webcam:", error);
      });
  }, [
    webcamRef,
    setCapturing,
    mediaRecorderRef,
    videoConstraints,
    handleStopCaptureClick,
  ]);

  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
        //data is blob
        const videoBlob = new Blob([data], { type: "video/mp4" });
        console.log("data");
        console.log(data);
        const file = new File([videoBlob], "proof.mp4", { type: "video/mp4" });
        setProof(file);
        console.log("====================================");
        console.log(file);
        console.log("====================================");
      }
    },
    [setRecordedChunks]
  );

  const capture = useCallback(() => {
    //imageSrc is base64
    const imageSrc = webcamRef.current.getScreenshot();
    console.log("====================================");
    console.log(imageSrc);
    console.log("====================================");
    const image = new Image();
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;

      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, image.width, image.height);
      //convert to file
      canvas.toBlob((blob) => {
        const file = new File([blob], "proof.jpeg", { type: "image/jpeg" });
        setProof(file);
      }, "image/jpeg");
    };
  }, [webcamRef]);

  const toggleFacingMode = useCallback(() => {
    setFacingMode((prevFacingMode) =>
      prevFacingMode === "user" ? "environment" : "user"
    );
  }, []);

  return (
    <>
      <Webcam
        audio={false}
        ref={webcamRef}
        height={720}
        width={1280}
        videoConstraints={videoConstraints}
      />
      {capturing ? (
        <button onClick={handleStopCaptureClick}>Stop Capture</button>
      ) : (
        <button onClick={handleStartCaptureClick}>Start Capture</button>
      )}
      <button onClick={capture}>Capture photo</button>
      <button onClick={toggleFacingMode}>
        Toggle Camera: {facingMode === "user" ? "Back" : "Front"}
      </button>
      {proof && (
        <div>
          <h2>Proof:</h2>
          {proof.type.includes("image") ? (
            <img src={URL.createObjectURL(proof)} alt={proof.name} />
          ) : (
            <video src={URL.createObjectURL(proof)} controls />
          )}
          <p>File Name: {proof.name}</p>
        </div>
      )}
    </>
  );
};

export default Test3;
