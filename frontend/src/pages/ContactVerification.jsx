import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request } from '../utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { contactVerification } from '../redux/authSlice'

const ContactVerification = ({type}) => {
  const [code, setCode] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const handleContactVerification = async (e) => {
    e.preventDefault();

    try {


     
      const options = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const data = await request('/auth/contact-verification', 'POST', options, { code,type });
      console.log(data);
      
      const { success, message } = data;
      if (success) {
        toast.success(message);
        // navigate('/');
              dispatch(contactVerification(data));
              if(type=="register") {
        
                navigate('/');
              } 
              if(type=="forgot-password") {
        
                navigate('/new-password');
              } 

      } else {
        if (message !== 'input error') {
          toast.error(message);
        } else {
          // handle input message error here
          toast.error(message);
        }
      }




    } catch (error) {
      console.error(error);
    }
  };

  const handleResendCode = async () => {
    try {
      const options = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // Send request to resend verification code
      const data = await request('/auth/resend-code', 'PUT', options);

      const { success, message } = data;
      if (success) {
  
      toast.success(message);

      } else {
          toast.error(message);
     
      
        }
      
     
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <h2>ContactVerification</h2>
      <form onSubmit={handleContactVerification}>
        <input type="number" placeholder="" onChange={(e) => setCode(e.target.value)} />
        <button type="submit">ContactVerification</button>
      </form>

      {/* should be outside the form */}
        <button onClick={handleResendCode} >
            Resend Code
          </button>
    </>
  );
};

export default ContactVerification;
