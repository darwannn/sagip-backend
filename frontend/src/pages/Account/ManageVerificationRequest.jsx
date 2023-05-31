import React, { useEffect, useState } from 'react';

import { Link,useNavigate,useParams } from 'react-router-dom';

import { useSelector } from 'react-redux';

import { request } from '../../utils/axios';
import { safetyTipsCategory } from '../../utils/categories';

import { toast } from 'react-toastify';
import moment from 'moment';
import DataTable from 'react-data-table-component';

import { AiFillEdit, AiFillLike, AiFillDelete, AiOutlineArrowRight, AiOutlineLike } from 'react-icons/ai';
import { FiArrowRight } from 'react-icons/fi';

import Navbar from '../../components/Navbar';

const SafetyTips = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [safetyTips, setSafetyTips] = useState([]);
  const [filteredSafetyTips, setFilteredSafetyTips] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');

  const { user, token } = useSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalShown, setisModalShown] = useState(false);
  const [verificationRequest, setVerificationRequest] = useState("");

  useEffect(() => {
    const fetchSafetyTips = async () => {
      try {
        const data = await request('/auth/', 'GET');
        const filteredRecords = data.filter(
          (record) => record.verificationPicture.length !== 0 && record.status === "semi verified" &&  record.verificationRequestDate
        );
      console.log('====================================');
      console.log(filteredRecords);
      console.log('====================================');
        setSafetyTips(filteredRecords);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSafetyTips();
  }, []);

 

  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredSafetyTips(safetyTips.filter((safetyTip) =>
        safetyTip.firstname.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setFilteredSafetyTips(safetyTips.filter((safetyTip) =>
        safetyTip.category.toLowerCase() === activeCategory.toLowerCase() &&
        safetyTip.firstname.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    }
  }, [activeCategory, searchQuery, safetyTips]);

  useEffect(() => {
    const fetchVerificationRequest = async () => {
      try {
          const options = { 'Authorization': `Bearer ${token}` };
          const data = await request(`/auth/${id}`, 'GET', options);
         
    if(data.message != "not found") { 
  console.log(data);
            setVerificationRequest(data);
     if(data.status !== "semi verified") {
      navigate(`/manage/account/verification-request`);
     }
  
          } else {
            navigate(`/manage/account/verification-request`);
          }
  
        } catch (error) {
          console.error(error);
        }
      };
      
      if (id) {
        fetchVerificationRequest();
      setisModalShown(true);
    } else {
      setisModalShown(false);
    
    }
  }, [id, token,isModalShown]);


  const handleReject = async (e) => {
    e.preventDefault();

    try {
      const options = {     'Content-Type': 'application/json', Authorization: `Bearer ${token}`,};
      const data = await request(`/auth/verification-request/${id}`, 'PUT',options,{action:"reject"});
      const { success, message } = data;
   console.log(data);

      if(success) {
     
        toast.success(message);
       
     return; 
    }
    else {

        toast.success(message);
      
    } }catch (error) {  
      console.error(error);
    }
  };
  const handleVerify = async (e) => {
    e.preventDefault();

    try {
      const options = {     'Content-Type': 'application/json', Authorization: `Bearer ${token}`,};
      const data = await request(`/auth/verification-request/${id}`, 'PUT',options, {action:"approve"});
      const { success, message } = data;
   console.log(data);

      if(success) {
     
        toast.success(message);
       
     return; 
    }
    else {

        toast.success(message);
      
    } }catch (error) {
      console.error(error);
    }
  };

  return (
    <>
    <Navbar />
      
       
        <div>
        <div>Total Request: {safetyTips.length}</div>
        <input
  type="text"
  placeholder="Search safetyTips"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>
        
        </div>
        <div >
         
          {filteredSafetyTips.length > 0 ? (
            <div >
              {filteredSafetyTips.map((safetyTip) => (
                <div key={safetyTip._id} >
                  
                  <div >
                    <div >
                    </div>
                    <Link to={`/manage/account/verification-request/${safetyTip._id}`} >
                 
                    <h4>{ 
                    `${safetyTip.firstname} ${verificationRequest&&verificationRequest.middlename.split(' ').map(name => name.charAt(0)).join('')}`}</h4>
                    <h4>{ 
                    moment(safetyTip.verificationRequestDate).format('MMMM DD, YYYY HH:mm A')}</h4>
                    </Link>
                
                    
                  
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <h3 >No safetyTips</h3>
          )}
        </div>

        <br></br>
        <br></br>
        {isModalShown && (
        <>
         <Link to="/manage/account/resident">
          Go Back
        </Link>
          <div> Name: 
            {  `${verificationRequest.firstname} ${verificationRequest&&verificationRequest.middlename.split(' ').map(name => name.charAt(0)).join('')} ${verificationRequest.lastname}`}
            </div>
         <br></br>
         <div> Address: 
         {`${verificationRequest.street}, ${verificationRequest.barangay}, ${verificationRequest.municipality}`}
          </div>  <br></br>
   
         <div> Contact Number: #{verificationRequest.contactNumber}
          </div>  <br></br>
         <div> Date of Birth { moment(verificationRequest.birthdate).format('MMMM DD, YYYY')}
          </div>  <br></br>
          <h4>Requested Created { 
                    moment(verificationRequest.verificationRequestDate).format('MMMM DD, YYYY HH:mm A')}</h4>  <br></br>
          <h4>Date Created{ 
                    moment(verificationRequest.createdAt).format('MMMM DD, YYYY HH:mm A')}</h4>


{
  verificationRequest.verificationPicture &&
  verificationRequest.verificationPicture.map((picture, index) => (
    <img
      src={`http://localhost:5000/images/${picture}`}
      key={index}
      style={{ width: "300px" }}
      
    />
  ))
}


                    <button onClick={handleReject}>Reject Verification</button>
                    <br></br>
                    <button onClick={handleVerify}>Verify</button>
        </>
      )}
    </>
  );
};

export default SafetyTips;