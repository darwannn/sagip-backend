import { useState } from 'react';

import {useNavigate } from 'react-router-dom';

import { contactVerification } from '../redux/authSlice'
import { useDispatch, useSelector } from 'react-redux';

import { request } from '../utils/axios';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



const ContactVerification = ({type}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { token } = useSelector((state) => state.auth);
  const [code, setCode] = useState('');


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
      console.log('====================================');
      console.log(data);
      console.log('====================================');
      if (success) {
        toast.success(message);
        // navigate('/');
        dispatch(contactVerification(data));
        if(type=="register") {
          navigate('/login');
              } 
              if(type=="forgot-password") {
                
                navigate('/new-password');
              } 
              if(type=="login") {
                navigate('/login');
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

      const data = await request('/auth/resend-code', 'PUT', options);

      const { success, message } = data;
      if (success) {
      toast.success(message);
      } else {
          toast.error(message);
        }
     
    } catch (error) {
      console.error(error);
      toast.error(error);
    }
  };

  return (
    <>
      <h2>Contact Verification</h2>
      <form onSubmit={handleContactVerification}>
        <input type="number" placeholder="" onChange={(e) => setCode(e.target.value)} />
        <button type="submit">ContactVerification</button>
      </form>
        <button onClick={handleResendCode} >
            Resend Code
          </button>
    </>
  );
};

export default ContactVerification;
