import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request } from '../utils/fetchApi';
import { useDispatch, useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { contactVerification } from '../redux/authSlice'

const ContactVerification = () => {
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

      const data = await request('/auth/contact-verification', 'POST', options, { code });
      console.log(data);
      
      const { success, message } = data;
      if (success) {
        
              dispatch(contactVerification(data));
        navigate('/');
      } else {
        if (message !== 'input error') {
          toast.error(message);
        } else {
          // handle input message error here
        }
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
    </>
  );
};

export default ContactVerification;
