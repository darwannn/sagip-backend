import React from 'react'
import classes from './navbar.module.css'
import { Link } from 'react-router-dom'
import womanImg from '../../assets/woman.jpg'
import { useState } from 'react'
import { logout } from '../../redux/authSlice'
import { useDispatch } from 'react-redux'

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Navbar = () => {
  const dispatch = useDispatch()

const handleLogout = () => {
  dispatch(logout())
}
const notify = () => toast("Wow so easy!");
  const [showModal, setShowModal] = useState(false)

  return (
    <div className={classes.container}>
      <div className={classes.wrapper}>
        <div className={classes.left}>
          <Link to='/'>Home</Link>
        </div>
        <ul className={classes.center}>
        <button onClick={notify}>Notify!</button>
        <ToastContainer />
        </ul>
        <div className={classes.right}>
          <img onClick={() => setShowModal(prev => !prev)} src={womanImg} className={classes.img} />
          {showModal &&
            <div className={classes.modal}>
              <Link to='/create'>Create</Link>
              <span onClick={handleLogout}>Logout</span>
            </div>
          }
          
        </div>
      </div>
    </div>
  )
}

export default Navbar