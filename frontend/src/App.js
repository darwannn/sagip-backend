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
import SafetyTipsInput from './pages/SafetyTipsInput';
import SafetyTipDetails from './pages/SafetyTipDetails';

import { useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NewPassword from './pages/NewPassword';
import SendAlert from './pages/SendAlert';

/* const Error = () => {
  return <h1>404 Not Found</h1>;
}; */


/* 
saka na lang ayusin access
nakakalito
....

*/
const App = () => {
  const { user, token } = useSelector((state) => state.auth);
  const location = useLocation();
  console.log('User:', user);
  console.log('TokenA:', token);
  return (
    <div>
      <ToastContainer />
      <Routes>
   
        <Route path="/" element={ <Home />}/>

        <Route path="/login" element={<Login/>}/>

        <Route path="/register" element={<Register />}   />
        <Route path="/register/contact-verification" element={user? user.status == "unverified" || user.status != "banned"?<ContactVerification type="register"/>:<Navigate to="/" />: <ContactVerification  type="register"/>} />

        <Route path="/forgot-password" element={<ForgotPassword /> } />
        <Route path="/forgot-password/contact-verification" element={user? user.status != "unverified" || user.status != "banned" ?<ContactVerification type="forgot-password" />:<Navigate to="/" />: <ContactVerification type="forgot-password"/>} />
        <Route path="/new-password" element={ <NewPassword/>} />


        <Route path="/send-alert" element={<SendAlert />}   />

        <Route path="/safety-tips" element={<SafetyTips/>} />

        <Route path="/safety-tips/add" element={user ? <SafetyTipsInput type="add" /> : <Navigate to="/login" />} />
        <Route path="/safety-tips/:id" element={user ? <SafetyTipDetails /> : <Navigate to="/login" />} />
        <Route path="/safety-tips/update/:id" element={user ? <SafetyTipsInput type="update" /> : <Navigate to="/login" />} />
        <Route path="/safety-tips/saved" element={user ? <SavedSafetyTips /> : <Navigate to="/login" />} />
 
 
        {location.pathname !== "/" && <Route path="*" element={<Error />} />}
      </Routes>
    </div>
  );
};

export default App;
