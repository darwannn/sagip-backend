import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom'
import BlogHome from './pages/BlogHome/BlogHome';
import Home from './pages/Home';
import LikedPost from './pages/LikedPost';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/login/Login';
import Register from './pages/register/Register';
import Create from './pages/create/Create';
import BlogDetails from './pages/blogDetails/BlogDetails';

import { useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function App() {
  const { user } = useSelector((state) => state.auth)

  return (
    <div>     <ToastContainer />
      <Routes>
        <Route path='/' element={user ? <BlogHome /> : <Navigate to='/login' />} />
        <Route path='/home' element={user ? <Home /> : <Navigate to='/login' />} />
        <Route path='/login' element={!user ? <Login /> : <Navigate to='/' />} />
        <Route path='/register' element={!user ? <Register /> : <Navigate to='/' />} />
        <Route path='/create' element={user ? <Create mode={"create"} /> : <Navigate to='/login' />} />
        <Route path='/blogDetails/:id' element={user ? <BlogDetails /> : <Navigate to='/login' />} />
        <Route path='/updateBlog/:id' element={user ? <Create mode={"update"} /> : <Navigate to='/login' />} />

        <Route path='/likedPosts' element={user ? <LikedPost /> : <Navigate to='/login' />} />
{/*         <Route path='/forgot-password' element={user ? <ForgotPassword /> : <Navigate to='/login' />} /> */}
      </Routes>
    </div>
  );
}

export default App;
