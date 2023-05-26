import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request } from '../utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const SendAlert = () => {

    const [alertMessage, setAlertMessage] = useState("")
    const [location, setLocation] = useState("")
  
    const dispatch = useDispatch()
    const navigate = useNavigate()
  
    const handleLogin = async(e) => {
      e.preventDefault()
  
      try {
        const options = {
          'Content-Type': 'application/json'
        } 
  
        const data = await request("/api/send-alert", 'POST', options, {alertMessage,location})
       
         // console.log('Token:', data.token);
          console.log(data);
          const { success, message } = data;
          console.log(message);
          if(success) {
          
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
          
            {/* dito masasave yung locaiton kung saan masesend yung sms
            cehckbox all, or barangay
            ALL = Malolos
            OR
            San Pablo, Dakila..... (camma separated) 
            */}
            
            <input type="text" placeholder='message...' value={alertMessage} onChange={(e) => setAlertMessage(e.target.value)} />
            {/* hidden dapat yung input,pwedeng wala na din input diretso setLocation na */}
            <input type="text" placeholder='location...' value={location} onChange={(e) => setLocation(e.target.value)} />
            <button type="submit">Forgot Pass</button>
          </form>
   
      </>
    )
  }

export default SendAlert;
