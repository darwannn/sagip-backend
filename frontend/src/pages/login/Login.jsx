import React from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { request } from '../../utils/fetchApi'
import classes from './login.module.css'
import {useDispatch} from 'react-redux'
import { login } from '../../redux/authSlice'

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogin = async(e) => {
    e.preventDefault()

    try {
      const options = {
        'Content-Type': 'application/json'
      } 


      const data = await request("/auth/login", 'POST', options, { identifier,
        password})
     
        console.log('Token:', data.token);
        console.log(data);
        const { success, message } = data;
        if(success) {
        dispatch(login(data))
        toast.success(message);
         navigate('/register/contact-verification');  
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
    <div className={classes.container}>
      <div className={classes.wrapper}>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder='Ident...' value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          <input type="password" placeholder='Password...' value={password} onChange={(e) => setPassword(e.target.value)} />
          <p>Forgot Password? <Link to='/forgot-password'>Register</Link></p>
          <button type="submit">Login</button>
          <p>Don't have an account? <Link to='/register'>Register</Link></p>
        </form>
      </div>
    </div>
  )
}

export default Login