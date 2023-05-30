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

import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import NewPassword from './pages/Auth/NewPassword';
import ContactVerification from './pages/Auth/ContactVerification';

import SafetyTips from './pages/SafetyTip/SafetyTips';
import SavedSafetyTips from './pages/SafetyTip/SavedSafetyTips';
import SafetyTipDetails from './pages/SafetyTip/SafetyTipDetails';

import ManageSafetyTips from './pages/SafetyTip/ManageSafetyTips';
import SafetyTipInput from './pages/SafetyTip/SafetyTipInput';

import EmergencyFacility from './pages/EmergencyFacility/EmergencyFacility';
import ManageEmergencyFacility from './pages/EmergencyFacility/ManageEmergencyFacility';

import SendAlert from './pages/SendAlert';

import ManageAccount from './pages/Account/ManageAccount';
import AccountInput from './pages/Account/AccountInput';


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

        <Route path="/manage/send-alert" element={<SendAlert />} />

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



         <Route
          path="/manage/account/resident"
          element={
            <ManageAccount user="resident"/>
        }
        />
         <Route
          path="/manage/account/employee"
          element={
            <ManageAccount user="employee"/>
        }
        />
         <Route
          path="/manage/account/resident/identity-verification"
          element={
            <ManageAccount user="resident"/>
        }
        />
     
         <Route
          path="/manage/account/resident/add"
          element={
            <AccountInput user="resident" type="add"/>
        }
        />
         <Route
          path="/manage/account/employee/add"
          element={
            <AccountInput user="employee" type="add"/>
        }
        />
     
         <Route
          path="/manage/account/resident/update/:id"
          element={
            <AccountInput user="resident" type="update"/>
        }
        />
         <Route
          path="/manage/account/employee/update/:id"
          element={
            <AccountInput user="employee" type="update"/>
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
