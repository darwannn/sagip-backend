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

/* const Error = () => {
  return <h1>404 Not Found</h1>;
}; */

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
          user? user.status == "unverified"?<Navigate to="/register/contact-verification" />:<BlogHome/>: <Navigate to="/login" />
          } />
        <Route path="/home" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route path="/login" element={user ? user.status == "unverified"?<Login />:<Navigate to="/" />: <Login/>} 
        
        />
        <Route path="/register" element={user ? user.status == "unverified"?<Register />:<Navigate to="/" />:  <Register />}   />




        <Route path="/create" element={user ? <Create mode="create" /> : <Navigate to="/login" />} />
        <Route path="/blogDetails/:id" element={user ? <BlogDetails /> : <Navigate to="/login" />} />
        <Route path="/updateBlog/:id" element={user ? <Create mode="update" /> : <Navigate to="/login" />} />

        <Route path="/likedPosts" element={user ? <LikedPost /> : <Navigate to="/login" />} />
        <Route path="/forgot-password" element={user ? <Navigate to="/login" />:<ForgotPassword /> } />
        <Route path="/register/contact-verification" element={
          user? user.status == "unverified"?<ContactVerification />:<Navigate to="/" />: <ContactVerification />
          } />
      {/*   <Route path="/forgot-password/new-password'" element={
          user? user.status == "unverified"?<ContactVerification />:<Navigate to="/" />: <ContactVerification />
          } />
 */}

        {/* 404 error handling */}
        {location.pathname !== "/" && <Route path="*" element={<Error />} />}
      </Routes>
    </div>
  );
};

export default App;
