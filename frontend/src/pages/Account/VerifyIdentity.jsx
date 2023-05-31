import React, { useState, useRef } from 'react';

function VerifyIdentity() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [selfieImage, setSelfieImage] = useState(null);

  const handleStartCamera = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        })
        .catch((error) => {
          console.error('Error accessing camera:', error);
        });
    }
  };

  const handleCapture = () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

    const capturedImage = canvasRef.current.toDataURL('image/png');
    setSelfieImage(capturedImage);

    // Stop the video stream
    const stream = videoRef.current.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());
  };

  const handleSubmit = (event) => {
    event.preventDefault();
//
  
    setSelfieImage(null);
  };

  return (
    <div>
      <h2>Verify Identity</h2>
      <div>
        <button onClick={handleStartCamera}>Start Camera</button>
        <button onClick={handleCapture}>Capture</button>
      </div>
      <div>
        <video ref={videoRef} width="400" height="300" />
        <canvas ref={canvasRef} style={{ display: 'none' }} width="400" height="300" />
      </div>
      <form onSubmit={handleSubmit}>
        {selfieImage && (
          <img src={selfieImage} alt="Captured selfie" width="200" height="150" />
        )}

        <button type="submit" disabled={!selfieImage}>
          Submit
        </button>
      </form>
    </div>
  );
}

export default VerifyIdentity;
