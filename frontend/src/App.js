import './App.css';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SafetyTips from './pages/SafetyTips';
import Home from './pages/Home';
import SavedSafetyTips from './pages/SavedSafetyTips';
import Error from './pages/Error';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import ContactVerification from './pages/ContactVerification';
import Register from './pages/Register';
import SafetyTipInput from './pages/SafetyTipInput';
import SafetyTipDetails from './pages/SafetyTipDetails';
import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NewPassword from './pages/NewPassword';
import SendAlert from './pages/SendAlert';
import jwtDecode from 'jwt-decode';
import { logout } from './redux/authSlice'; // Assuming the logout action is defined in authSlice

const App = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  console.log('User:', user);
  console.log('TokenA:', token);

  const checkTokenExpiration = () => {
    if (token) {
      // Decode the JWT token to extract the expiration time
      const decodedToken = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);

      
      if (decodedToken.exp < currentTime) {
        dispatch(logout());
      } else {
        console.log('====================================');
        console.log("not expired");
        console.log('====================================');
      }
    }
  };

  useEffect(() => {
    checkTokenExpiration();
  }, [token]);

  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

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

        <Route
          path="/safety-tips/add"
          element={
            user ? (
              <SafetyTipInput type="add" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/safety-tips/:id"
          element={
            user ? (
              <SafetyTipDetails />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/safety-tips/update/:id"
          element={
            user ? (
              <SafetyTipInput type="update" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/safety-tips/saved"
          element={
            user ? (
              <SavedSafetyTips />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {location.pathname !== "/" && (
          <Route path="*" element={<Error />} />
        )}
      </Routes>
    </div>
  );
};

export default App;
