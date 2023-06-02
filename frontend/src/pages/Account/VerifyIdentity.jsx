import React, { useEffect, useState, useRef } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { useSelector } from "react-redux";

import { request } from "../../utils/axios";
import { statusCategory } from "../../utils/categories";

import { toast } from "react-toastify";
import moment from "moment";
import DataTable from "react-data-table-component";

import {
  AiFillEdit,
  AiFillLike,
  AiFillDelete,
  AiOutlineArrowRight,
  AiOutlineLike,
} from "react-icons/ai";
import { FiArrowRight } from "react-icons/fi";

import Navbar from "../../components/Navbar";
function VerifyIdentity() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [selfieImage, setSelfieImage] = useState(null);
  const { token, user } = useSelector((state) => state.auth);
  const [contactNumber, setContactNumber] = useState("");

  useEffect(() => {
    console.log(user);

    const fetchAccountDetails = async () => {
      try {
        const options = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
        const data = await request(`/auth/${user.id}`, "GET", options);
        console.log(data);
        setContactNumber(data.verificationRequestDate);
        if (data.status === "verified") {
          navigate("/");
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchAccountDetails();
  }, [token, user]);

  const handleStartCamera = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Check if the device is a mobile phone
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        // Open the camera app on a mobile device
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.capture = "camera";

        input.onchange = (event) => {
          const file = event.target.files[0];
          const reader = new FileReader();

          reader.onload = (e) => {
            const capturedImage = e.target.result;
            setSelfieImage(capturedImage);
          };

          reader.readAsDataURL(file);
        };

        input.click();
      } else {
        // Open the camera in a desktop browser
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          })
          .catch((error) => {
            console.error("Error accessing camera:", error);
          });
      }
    }
  };

  const handleCapture = () => {
    const context = canvasRef.current.getContext("2d");
    context.drawImage(
      videoRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    const capturedImage = canvasRef.current.toDataURL("image/png");
    setSelfieImage(capturedImage);

    // Stop the video stream
    const stream = videoRef.current.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());
  };

  function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    e.preventDefault();

    const formData = new FormData();
    /* formData.append("identificationCardPicture", "picture.png");
    formData.append("selfieImage", dataURItoBlob(selfieImage)); */
    formData.append("selfieImage", dataURItoBlob(selfieImage), "selfie.png");
    formData.set(
      "selfieImage",
      new File([formData.get("selfieImage")], "selfie.png", {
        type: "image/png",
      })
    );

    try {
      const options = { Authorization: `Bearer ${token}` };
      /*  const data = await request(url, method, options, formData); */
      const data = await request(
        `/auth/verify-identity`,
        "PUT",
        options,
        formData,
        true
      );
      console.log(data);
      const { success, message } = data;
      if (success) {
        toast.success(message);

        return;
      } else {
        if (message != "input error") {
          toast.success(message);
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
      {contactNumber ? (
        <>We are verifying your request...</>
      ) : (
        <>
          <h2>Verify Identity</h2>
          <div>
            <button onClick={handleStartCamera}>Start Camera</button>
            <button onClick={handleCapture}>Capture</button>
          </div>
          <div>
            <video ref={videoRef} width="400" height="300" />
            <canvas
              ref={canvasRef}
              style={{ display: "none" }}
              width="400"
              height="300"
            />
          </div>
          <form onSubmit={handleSubmit}>
            {selfieImage && (
              <img
                src={selfieImage}
                alt="Captured selfie"
                width="200"
                height="150"
              />
            )}

            <button type="submit">Submit</button>
          </form>
        </>
      )}
    </div>
  );
}

export default VerifyIdentity;
