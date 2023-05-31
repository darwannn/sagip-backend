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
  const [safetyTipDetails, setSafetyTipDetails] = useState("");

  useEffect(() => {
    const fetchSafetyTips = async () => {
      try {
        const data = await request('/auth/', 'GET');
        const filteredRecords = data.filter(
          (record) => record.verificationPicture.length !== 0 && record.status === "semi verified" &&  record.verificationRequestDate
        );
      
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
    if (id) {
      const fetchSafetyTipDetails = async () => {
        try {
          const options = { 'Authorization': `Bearer ${token}` };
          const data = await request(`/auth/${id}`, 'GET', options);
         
    if(data.message != "not found") { 
  console.log(data);
            setSafetyTipDetails(data);
     
  
          } else {
            navigate(`/manage/account/verification-request`);
          }
  
        } catch (error) {
          console.error(error);
        }
      };
      fetchSafetyTipDetails();
      setisModalShown(true);
    
    
    } else {
      setisModalShown(false);
    
    }
  }, [id, token]);

  return (
    <>
    <Navbar />
      
       
        <div>
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
                    `${safetyTip.firstname} ${safetyTipDetails&&safetyTipDetails.middlename.split(' ').map(name => name.charAt(0)).join('')}`}</h4>
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
            {  `${safetyTipDetails.firstname} ${safetyTipDetails&&safetyTipDetails.middlename.split(' ').map(name => name.charAt(0)).join('')} ${safetyTipDetails.lastname}`}
            </div>
         <br></br>
         <div> Address: 
         {`${safetyTipDetails.street}, ${safetyTipDetails.barangay}, ${safetyTipDetails.municipality}`}
          </div>  <br></br>
   
         <div> Contact Number: #{safetyTipDetails.contactNumber}
          </div>  <br></br>
         <div> Date of Birth { moment(safetyTipDetails.birthdate).format('MMMM DD, YYYY')}
          </div>  <br></br>
          <h4>Requested Created { 
                    moment(safetyTipDetails.verificationRequestDate).format('MMMM DD, YYYY HH:mm A')}</h4>  <br></br>
          <h4>Date Created{ 
                    moment(safetyTipDetails.createdAt).format('MMMM DD, YYYY HH:mm A')}</h4>


{
  safetyTipDetails.verificationPicture &&
  safetyTipDetails.verificationPicture.map((picture, index) => (
    <img
      src={`http://localhost:5000/images/${picture}`}
      key={index}
      style={{ width: "300px" }}
      
    />
  ))
}


                  {/*   <button onClick={handleReject}>Reject Verification</button>
                    <br></br>
                    <button onClick={handleVerify}>Verify</button> */}
        </>
      )}
    </>
  );
};

export default SafetyTips;