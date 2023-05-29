
import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';
import { newPassword } from '../redux/authSlice'


import { request } from '../utils/axios';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const NewPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { token } = useSelector((state) => state.auth);
  const [password, setPassword] = useState('');

  const handleNewPassword = async (e) => {
    e.preventDefault();
    try {
      const options = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const data = await request('/auth/new-password', 'POST', options, { password });
      console.log(data);
      
      const { success, message } = data;
      if (success) {
        toast.success(message);
              dispatch(newPassword(data));
                navigate('/login');
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
      <h2>NewPassword</h2>
      <form onSubmit={handleNewPassword}>
        <input type="text" placeholder="" onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">NewPassword</button>
      </form>
    </>
  );
};

export default NewPassword;
