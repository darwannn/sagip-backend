import './App.css';
import { Routes, Route, Navigate, useLocation,useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import { logout } from './redux/authSlice'; 

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux';


import Home from './pages/Home';
import Error from './pages/Error';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NewPassword from './pages/NewPassword';
import ContactVerification from './pages/ContactVerification';

import SafetyTips from './pages/SafetyTips';
import SavedSafetyTips from './pages/SavedSafetyTips';
import SafetyTipDetails from './pages/SafetyTipDetails';

import ManageSafetyTips from './pages/ManageSafetyTips';
import SafetyTipInput from './pages/SafetyTipInput';

import EmergencyFacility from './pages/EmergencyFacility';
import ManageEmergencyFacility from './pages/ManageEmergencyFacility';

import SendAlert from './pages/SendAlert';


const App = () => {

  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('User:', user);
  console.log('TokenA:', token);


  useEffect(() => {
    checkTokenExpiration();
  }, [token]);

  const checkTokenExpiration = () => {
    if (token) {
      const decodedToken = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (decodedToken.exp < currentTime) {
        console.log("expired");
        dispatch(logout());
        navigate(`/login`);
      } else {
        console.log("not expired");
      }
    }
  };


  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route
          path="/login/contact-verification"
          element={
           
              <ContactVerification type="login" />
            
          }
        />

        <Route path="/register" element={<Register />} />
        <Route
          path="/register/contact-verification"
          element={
            user && user.status === "unverified" ? (
              <ContactVerification type="register" />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/forgot-password/contact-verification"
          element={
            user && user.status !== "unverified" ? (
              <ContactVerification type="forgot-password" />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path="/new-password" element={<NewPassword />} />

        <Route path="/send-alert" element={<SendAlert />} />

        <Route path="/safety-tips" element={<SafetyTips />} />

        <Route path="/manage/safety-tips" element={<ManageSafetyTips />} />

        <Route
          path="/manage/safety-tips/add"
          element={
            user ? (
              <SafetyTipInput type="add" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/manage/safety-tips/:id"
          element={
            user ? (
              <SafetyTipDetails />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/manage/safety-tips/update/:id"
          element={
            user ? (
              <SafetyTipInput type="update" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/manage/safety-tips/saved"
          element={
            user ? (
              <SavedSafetyTips />
            ) : (
              <Navigate to="/login" />
            )
          }
        />



<Route
          path="/emergency-facility"
          element={
              <EmergencyFacility />
          }
        />
<Route
          path="/manage/emergency-facility"
          element={
              <ManageEmergencyFacility />
          }
        />
         <Route
          path="/manage/emergency-facility/:id"
          element={
            <ManageEmergencyFacility />
        }
        />
         <Route
          path="/manage/emergency-facility/add"
          element={
            <ManageEmergencyFacility />
        }
        />










      {/* if no route path found*/}
        {location.pathname !== "/" && (
          <Route path="*" element={<Error />} />
        )}
      </Routes>
    </div>
  );
};

export default App;
