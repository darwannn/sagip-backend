
import { useState } from 'react'

import { Link, useNavigate } from 'react-router-dom'

import { login } from '../../redux/authSlice'
import {useDispatch} from 'react-redux'

import { request } from '../../utils/axios'

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  

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
         navigate('/');  
      }
        else {
          if(message != "input error") {
            toast.error(message);
            if (message.includes("attempts")) {
              navigate('/login/contact-verification');
            } 
          } 
          
          else {
            toast.error(message);
          }
        }
    
    } catch (error) {
      console.error(error)
    }
  }

  return (
    < >
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder='Ident...' value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          <input type="password" placeholder='Password...' value={password} onChange={(e) => setPassword(e.target.value)} />
          <p>Forgot Password? <Link to='/forgot-password'>Register</Link></p>
          <button type="submit">Login</button>
          <p>Don't have an account? <Link to='/register'>Register</Link></p>
        </form>
     
    </>
  )
}

export default Login