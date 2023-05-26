import './App.css';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import BlogHome from './pages/BlogHome/BlogHome';
import Home from './pages/Home';
import LikedPost from './pages/LikedPost';
import Error from './pages/Error';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/login/Login';
import ContactVerification from './pages/ContactVerification';
import Register from './pages/register/Register';
import Create from './pages/create/Create';
import BlogDetails from './pages/blogDetails/BlogDetails';

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
        {/* una kasi */}
        <Route path="/" element={
          user  && user.for == "login" ? user.status == "unverified"?<Navigate to="/register/contact-verification" />:<BlogHome/>: <Navigate to="/login" />
          } />
        <Route path="/home" element={ <Home />}/>

        
        <Route path="/login" element={<Login/>} 
        
        />
        <Route path="/register" element={<Register />}   />
        <Route path="/send-alert" element={<SendAlert />}   />

        <Route path="/create" element={user ? <Create mode="create" /> : <Navigate to="/login" />} />
        <Route path="/blogDetails/:id" element={user ? <BlogDetails /> : <Navigate to="/login" />} />
        <Route path="/updateBlog/:id" element={user ? <Create mode="update" /> : <Navigate to="/login" />} />

        <Route path="/likedPosts" element={user ? <LikedPost /> : <Navigate to="/login" />} />
        <Route path="/forgot-password" element={<ForgotPassword /> } />
        <Route path="/register/contact-verification" element={
          user? user.status == "unverified" || user.status != "banned"?<ContactVerification type="register"/>:<Navigate to="/" />: <ContactVerification  type="register"/>
          } />
        <Route path="/forgot-password/contact-verification" element={
          user? user.status != "unverified" || user.status != "banned" ?<ContactVerification type="forgot-password" />:<Navigate to="/" />: <ContactVerification type="forgot-password"/>
          } />
   <Route path="/new-password" element={ <NewPassword/>
          } />
        {/* 404 error handling */}
        {location.pathname !== "/" && <Route path="*" element={<Error />} />}
      </Routes>
    </div>
  );
};

export default App;
