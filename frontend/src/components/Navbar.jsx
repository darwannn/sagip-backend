import React from 'react'
// import classes from './navbar.module.css'
import { Link, useNavigate } from 'react-router-dom'

import { logout } from '../redux/authSlice'
import { useDispatch } from 'react-redux'

/* import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
 */
const Navbar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

const handleLogout = () => {
  dispatch(logout())
navigate('/login')
}

  return (
    < >

        <div >
          <Link to='/'>Home</Link>
        </div>
        <ul >

        </ul>
        <div >
          
              <span onClick={handleLogout}>Logout</span>
           
          
        </div>
      </>
  
  )
}

export default Navbar