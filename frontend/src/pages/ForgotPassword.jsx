import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request } from '../utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { forgotPassword } from '../redux/authSlice'

const ForgotPassword = () => {
    const [identifier, setIdentifier] = useState("")
  
    const dispatch = useDispatch()
    const navigate = useNavigate()
  
    const handleLogin = async(e) => {
      e.preventDefault()
  
      try {
        const options = {
          'Content-Type': 'application/json'
        } 
  
        const data = await request("/auth/forgot-password", 'POST', options, { identifier})
       
          console.log('Token:', data.token);
          console.log(data);
          const { success, message } = data;
          if(success) {
          dispatch(forgotPassword(data))
          toast.success(message);
            navigate('/forgot-password/contact-verification');
        }
          else {
            if(message != "input error") {
              toast.error(message);
            }  else {
              // do input message error here
              toast.error(message);
            }
          }
      
      } catch (error) {
        console.error(error)
      }
    }
  
    return (
      <>
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder='Ident...' value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
            <button type="submit">Forgot Pass</button>
          </form>
   
      </>
    )
  }

export default ForgotPassword;
