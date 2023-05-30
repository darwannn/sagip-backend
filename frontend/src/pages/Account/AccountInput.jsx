import { useState, useEffect } from 'react';

import { Link, useParams, useNavigate } from 'react-router-dom';

import { useSelector } from 'react-redux';

import { request } from '../../utils/axios';
import { statusCategory,userTypeCategory } from '../../utils/categories';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import { AiOutlineCloseCircle, AiOutlineArrowRight } from 'react-icons/ai';

import Navbar from '../../components/Navbar';

const AccountInput = ({ user, type }) => {
  const { id } = useParams();

  const navigate = useNavigate();

  const { token } = useSelector((state) => state.auth);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');

  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [hasChanged, setHasChanged] = useState(false);


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

  const [attempt, setAttempt] = useState('');
  const [userType, setUserType] = useState('');
  const [status, setStatus] = useState('');
  

  
   
     
  

  useEffect(() => {
    console.log(type);
    if (type === 'update') {
      const fetchAccountDetails = async () => {
        try {
          const options = {
            Authorization: `Bearer ${token}`,
          };
          const data = await request(`/auth/${id}`, 'GET', options);
console.log(data);
          setEmail(data.email);
          setPassword(data.password);
          setRegion(data.region);
          setProvince(data.province);
          setMunicipality(data.municipality);
          setBarangay(data.barangay);
          setStreet(data.street);
          setFirstname(data.firstname);
          setMiddlename(data.middlename);
          setLastname(data.lastname);
          setGender(data.gender);
          setBirthdate(data.birthdate);
          setContactNumber(data.contactNumber);
          setStatus(data.status);
          setUserType(data.userType);
          setAttempt(data.attempt);
     

      
        } catch (error) {
          console.error(error);
        }
      };
      fetchAccountDetails();
    }
  }, [id, type, setTitle, setContent, setCategory, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let url, method,formData;
    if (type === 'add') {
      url = '/auth/register';
      method = 'POST';
      formData = {
        email,
        password,
        region,
        province,
        municipality,
        barangay,
        street,
        firstname,
        middlename,
        lastname,
        gender,
        userType,
        birthdate,
        contactNumber,
        status:"fully verified",
        userType,
        verificationCode:0
      }
      
    } else if (type === 'update') {
      url = `/auth/update/${id}`;
      method = 'PUT';
      formData = {
        email,
        region,
        province,
        municipality,
        barangay,
        street,
        firstname,
        middlename,
        lastname,
        gender,
        userType,
        birthdate,
        contactNumber,
        status,
        verificationCode:0
      }
    }

    try {
      const options = { 'Content-Type': 'application/json' };
      const data = await request(url, method, options, formData);
      
      const { success, message } = data;
      if(success) {
     
        toast.success(message);
       
        {user=="resident"?   navigate('/manage/account/resident'):navigate('/manage/account/staff')}
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

 
  
  const resetPassword = async (e) => {
    e.preventDefault();
console.log("reset");
    try {

      
      const options = { 'Content-Type': 'application/json',   Authorization: `Bearer ${token}`, };
      const data = await request(`/auth/reset-password/${id}`, 'PUT', options, {
        password:"sagip",
      });
      
      const { success, message } = data;
      console.log(data);
      if(success) {
     
        toast.success(message);
   /*      navigate('/account/');   */

    }
    else {
        toast.error(message);
   
    } }catch (error) {
      console.error(error);
    }
  };



 

  return (
    <>
      <Navbar />
      <div>
        <div>
           
          <Link to= {user=="resident"?"/manage/account/resident":"/manage/account/staff"}>
            Go Back <AiOutlineArrowRight />
          </Link>
          <h2>{type === 'add' ? 'Add' : 'Update'} Safety Tip</h2>
          <form onSubmit={handleSubmit} encType="multipart/form-data">
          <input
            type="email"
            placeholder="Email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password..."
          
            onChange={(e) => setPassword(e.target.value)}
          />
     
          <input
            type="text"
            placeholder="Region..."
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
          <input
            type="text"
            placeholder="Province..."
            value={province}
            onChange={(e) => setProvince(e.target.value)}
          />
          <input
            type="text"
            placeholder="Municipality..."
            value={municipality}
            onChange={(e) => setMunicipality(e.target.value)}
          />
          <input
            type="text"
            placeholder="Barangay..."
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
          />
          <input
            type="text"
            placeholder="Street..."
            value={street}
            onChange={(e) => setStreet(e.target.value)}
          />
          <input
            type="text"
            placeholder="First Name..."
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
          />
          <input
            type="text"
            placeholder="Middle Name..."
            value={middlename}
            onChange={(e) => setMiddlename(e.target.value)}
          />
          <input
            type="text"
            placeholder="Last Name..."
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
          />
          <input
            type="text"
            placeholder="Gender..."
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          />
          <input
            type="text"
            placeholder="Birthdate..."
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
          />
          <input
            type="text"
            placeholder="Contact Number..."
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
          />
          
               


{/* <input

            type="text"
            placeholder="attempt"
            value={attempt}
            onChange={(e) => setAttempt(e.target.value)}
          />
 */}
 {console.log(type)}
 {type=="update"&&

<>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
  <option value="" hidden>
    Select a status
  </option>
  {statusCategory.slice(1).map((status, index) => (
    <option key={index} value={status}>
      {status.toUpperCase()}
    </option>
  ))}
</select>
</>
 }

<select value={userType} onChange={(e) => setUserType(e.target.value)}>
  <option value="" hidden>
    Select a Type
  </option>
  {userTypeCategory.slice(1).map((userType, index) => (
    <option key={index} value={userType}>
      {userType.toUpperCase()}
    </option>
  ))}
</select>
           {/* <input
            type="text"
            placeholder="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          /> */}
           {/* <input
            type="text"
            placeholder="type"
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
          /> */}
               
            
            
            
            
            
       
        
           
          
            <div>

                
              <button type="submit">Submit</button>
            </div>
          </form>
              <button onClick={resetPassword}>resetPassword</button>
        </div>
      </div>
    </>
  );
};

export default AccountInput;
