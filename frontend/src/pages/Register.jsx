
import { useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { register } from '../redux/authSlice';
import { useDispatch } from 'react-redux';

import { request } from '../utils/axios';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [region, setRegion] = useState('');
  const [province, setProvince] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [barangay, setBarangay] = useState('');
  const [street, setStreet] = useState('');
  const [firstname, setFirstname] = useState('');
  const [middlename, setMiddlename] = useState('');
  const [lastname, setLastname] = useState('');
  const [gender, setGender] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  
  
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      console.log("Passwords do not match");
      return;
    }
  
    try {
      const options = { 'Content-Type': 'application/json' };
      const data = await request('/auth/register', 'POST', options, {
        email,
        password,
        confirmPassword,
        region,
        province,
        municipality,
        barangay,
        street,
        firstname,
        middlename,
        lastname,
        gender,
        birthdate,
        contactNumber,
      });
      
      const { success, message } = data;
      if(success) {
        dispatch(register(data));
        toast.success(message);
        navigate('/register/contact-verification');  
     return; 
    }
    else {
      if(message != "input error") {
        toast.success(message);
      }  else {
        // do input message error here
      }
    } }catch (error) {
      console.error(error);
    }
  };
  
  return (
    <div >
      <div >
        <h2>Register</h2>
        <form onSubmit={handleRegister}>
          <input
            type="email"
            placeholder="Email..."
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password..."
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm Password..."
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <input
            type="text"
            placeholder="Region..."
            onChange={(e) => setRegion(e.target.value)}
          />
          <input
            type="text"
            placeholder="Province..."
            onChange={(e) => setProvince(e.target.value)}
          />
          <input
            type="text"
            placeholder="Municipality..."
            onChange={(e) => setMunicipality(e.target.value)}
          />
          <input
            type="text"
            placeholder="Barangay..."
            onChange={(e) => setBarangay(e.target.value)}
          />
          <input
            type="text"
            placeholder="Street..."
            onChange={(e) => setStreet(e.target.value)}
          />
          <input
            type="text"
            placeholder="First Name..."
            onChange={(e) => setFirstname(e.target.value)}
          />
          <input
            type="text"
            placeholder="Middle Name..."
            onChange={(e) => setMiddlename(e.target.value)}
          />
          <input
            type="text"
            placeholder="Last Name..."
            onChange={(e) => setLastname(e.target.value)}
          />
          <input
            type="text"
            placeholder="Gender..."
            onChange={(e) => setGender(e.target.value)}
          />
          <input
            type="text"
            placeholder="Birthdate..."
            onChange={(e) => setBirthdate(e.target.value)}
          />
          <input
            type="text"
            placeholder="Contact Number..."
            onChange={(e) => setContactNumber(e.target.value)}
          />
          <button type="submit">Register</button>
          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
