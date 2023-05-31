import React, { useEffect, useState , useRef} from 'react';

import { Link,useNavigate,useParams } from 'react-router-dom';

import { useSelector } from 'react-redux';

import { request } from '../../utils/axios';
import { statusCategory } from '../../utils/categories';

import { toast } from 'react-toastify';
import moment from 'moment';
import DataTable from 'react-data-table-component';

import { AiFillEdit, AiFillLike, AiFillDelete, AiOutlineArrowRight, AiOutlineLike } from 'react-icons/ai';
import { FiArrowRight } from 'react-icons/fi';

import Navbar from '../../components/Navbar';
function VerifyIdentity() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const { token,user } = useSelector((state) => state.auth);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    e.preventDefault();


    const formData = new FormData();
    formData.append('identificationCardPicture', "picture.png");
    formData.append('selfie', "selfie.png");


    try {
      const options = {     Authorization: `Bearer ${token}`,};
     /*  const data = await request(url, method, options, formData); */
      const data = await request(`/auth/verify-identity`, 'PUT', options, formData, true);
      console.log(data);
      const { success, message } = data;
      if(success) {
     
        toast.success(message);
       
     return; 
    }
    else {
      if(message != "input error") {
        toast.success(message);
      }  else {
    
      }
    } }catch (error) {
      console.error(error);
    }
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

        <button type="submit" >
          Submit
        </button>
      </form>
    </div>
  );
}

export default VerifyIdentity;
