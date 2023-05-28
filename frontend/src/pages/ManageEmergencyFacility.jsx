import React from 'react';
import { useEffect } from 'react';
import { request } from '../utils/axios';
import { format } from 'timeago.js';

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AiFillEdit, AiFillDelete, AiOutlineArrowRight } from 'react-icons/ai';
import { toast } from 'react-toastify';
import { AiOutlineCloseCircle } from 'react-icons/ai';

const EmergencyFacility = () => {

    const [safetyTipDetails, setSafetyTipDetails] = useState("");
    const [isModalShown, setisModalShown] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useSelector((state) => state.auth);
    
  /*   useEffect(() => {
      const fetchSafetyTipDetails = async () => {

        try {
          const options = { 'Authorization': `Bearer ${token}` };
          const data = await request(`/emergency-facility/${id}`, 'GET', options);
          setSafetyTipDetails(data);
        } catch (error) {
          console.error(error);
        }
      };
    
      if (id) {
        setisModalShown(true);
        setType("update")
        fetchSafetyTipDetails();
      } else {
        setisModalShown(false);
      }
    }, [id, token]); */
    
  
    const deleteEmergencyFacility = async () => {
      try {
        const options = { "Authorization": `Bearer ${token}` };
        const data = await request(`/emergency-facility/delete/${id}`, "DELETE", options);
        const { message } = data;
        toast.success(message);
        navigate(`/manage/emergency-facility`);
      } catch (error) {
        console.error(error);
      }
    };

/* ____________________________________ */


const [type, setType] = useState('update');
const [name, setName] = useState('');
const [latitude, setLatitude] = useState('');
const [longitude, setLongitude] = useState('');
const [image, setImage] = useState(null);
const [imageName, setImageName] = useState('');
const [hasChanged, setHasChanged] = useState(false);
const [category, setCategory] = useState('');
const [imageUrl, setImageUrl] = useState('');



const onChangeFile = (e) => {
  setImage(e.target.files[0]);
  setImageName(e.target.files[0].name);
  setHasChanged(true);
  const reader = new FileReader();
  reader.onload = () => {
    setImageUrl(reader.result);
  };
  reader.readAsDataURL(e.target.files[0]);
};

const handleCloseImage = () => {
  setImage(null);
  setImageName('');
  setImageUrl('');
};


const addEmergencyFacility = async (e) => {
  e.preventDefault();

  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    formData.append('category', category);
    formData.append('hasChanged', hasChanged);
 
      formData.append('image', image);
 
      const options = {
        Authorization: `Bearer ${token}`,
      };

    
const data = await request("/emergency-facility/add", "POST", options, formData, true);

    console.log(data);


    const { success, message } = data;
    if (success) {
      toast.success(message);
      navigate(`/manage/emergency-facility`);
      setisModalShown(false);
      //handleAddEmergencyFacility();
      setShouldFetchData(true);
    } else {
      if (message !== 'input error') {
        toast.error(message);
      } else {
        toast.error(message);
      }
    }
  } catch (error) {
    console.error(error);
  }
};


useEffect(() => {
  if (type === 'update') {
    const fetchSafetyTipDetails = async () => {
      try {
        const options = {
          Authorization: `Bearer ${token}`,
        };
        const data = await request(`/emergency-facility/${id}`, 'GET', options);
    console.log('====================================');
    console.log(data);
    console.log('====================================');
        if(data.message != "not found") {

          setName(data.name);
          setLatitude(data.latitude);
          setLongitude(data.longitude);
          setCategory(data.category);
          setImageUrl(`http://localhost:5000/images/${data.image}`);
      
        } else {
          navigate(`/manage/emergency-facility`);
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (id) {
      setisModalShown(true);
      fetchSafetyTipDetails();
    } else {
      setisModalShown(false);
    }

  }
}, [id, setName, setLatitude, setCategory, token]);

const updateEmergencyFacility = async (e) => {
  e.preventDefault();

  try {
  
    const formData = new FormData();
    formData.append('name', name);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    formData.append('category', category);
    formData.append('hasChanged', hasChanged);
 
      formData.append('image', image);
 
      const options = {
        Authorization: `Bearer ${token}`,
      };

    
      const data = await request(`/emergency-facility/update/${id}`, "PUT", options, formData,true);

/* 
    const data = await request('/emergency-facility/add', 'POST', options, formData); */
    console.log(data);



    const { success, message } = data;
    if (success) {
      toast.success(message);
    /*   navigate(`/manage/emergency-facility/${id}`); */
    } else {
      if (message !== 'input error') {
        toast.error(message);
      } else {
      
      }
    }
  } catch (error) {
    console.error(error);
  }
};












/* _________________________________ */

  const [emergencyFacility, setEmergencyFacility] = useState([]);
  const [filteredEmergencyFacility, setFilteredEmergencyFacility] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const { user } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = [
    'all',
    'police',
    'fire station',
    'hospital',
    'evacuation area',
  ];

  const [shouldFetchData, setShouldFetchData] = useState(true);

  useEffect(() => {
    const fetchEmergencyFacility = async () => {
      try {
        const data = await request('/emergency-facility/', 'GET');
        setEmergencyFacility(data);
        setFilteredEmergencyFacility(data);
      } catch (error) {
        console.error(error);
      }
    };
  
    if (shouldFetchData) {
      fetchEmergencyFacility();
      setShouldFetchData(false);
    }
  }, [shouldFetchData]);
  
 
  

  useEffect(() => {
    if (activeCategory === 'all') {
      
      setFilteredEmergencyFacility(emergencyFacility.filter((emergencyFacility) =>
        emergencyFacility.name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setFilteredEmergencyFacility(emergencyFacility.filter((emergencyFacility) =>
        emergencyFacility.category.toLowerCase() === activeCategory.toLowerCase() &&
        emergencyFacility.name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    }
  }, [activeCategory, searchQuery, emergencyFacility]);

  return (
    <>
      <Navbar />
      <br></br>
      <br></br>

      <div>
      <div>
        {categories.slice(1).map((category) => (
          <div key={category}>
            <h3>{category}</h3>
            <p>
              {
                emergencyFacility.filter(
                  (emergencyFacility) =>
                    emergencyFacility.category.toLowerCase() ===
                      category.toLowerCase()
                ).length
              }
            </p>
          </div>
        ))}
      </div>
      </div>
      
      


      <br></br>
      <br></br>
      <Link to="/manage/emergency-facility/add" onClick={() => {setisModalShown(true); setType("add")}}>
  Add
</Link>

      <div>
        <input
          type="text"
          placeholder="Search emergencyFacility"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div>
        {categories.map((category) => (
          <span style={{ margin: "10px" }} key={category} onClick={() => setActiveCategory(category)}>
            {category}
          </span>
        ))}
      </div>
      {filteredEmergencyFacility.length > 0 ? (
  <div>
    {filteredEmergencyFacility.map((emergencyFacility) => (
      <Link to={`/manage/emergency-facility/${emergencyFacility._id}`} key={emergencyFacility._id}
      >
        {/* <div onClick={()=> setType("update")}> */}
          <div>
          <div>
            <span> {emergencyFacility.name}</span>
          </div>
          <h4>{emergencyFacility._id}</h4>
        </div>
        <br></br>
      </Link>
    ))}
  </div>
) : (
  <h3>No emergencyFacility</h3>
)}

      
      
      <br></br>
      <br></br>
      <br></br>
      <br></br>

      { isModalShown && (
  <>
    <div>
        <div>
          <Link to="/manage/emergency-facility">
            Go Back <AiOutlineArrowRight />
          </Link>
          <h2>{type} SafetyTip</h2>
          <form onSubmit={type === 'add' ? addEmergencyFacility : updateEmergencyFacility} encType="multipart/form-data">
          <div>
                  <AiFillDelete onClick={deleteEmergencyFacility} />
                </div>
            <div>
              <label>Title: </label>
              <input type="text" placeholder="name..." value={name} onChange={(e) =>setName(e.target.value)} />
            </div>
            <div>
              <label>Description: </label>
              <input type="text" placeholder="latitude..." value={latitude} onChange={(e) =>setLatitude(e.target.value)} />
            </div>
            <div>
              <label>Description: </label>
              <input type="text" placeholder="longitude..." value={longitude} onChange={(e) => setLongitude(e.target.value)} />
            </div>
            <div>
              <label>Category: </label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="image">
                Image: <span>Upload here</span>
              </label>
              <input id="image" type="file" onChange={onChangeFile} />
              {image && (
                <p>
                  {imageName} <AiOutlineCloseCircle onClick={() => handleCloseImage()} />
                </p>
              )}

{imageUrl && (
  <img src={imageUrl} alt="Selected" />
)}
            </div>
            <div>
              <button type="submit">Submit form</button>
            </div>
          </form>
        </div>
      </div>
      
  </>
)}

    </>
  );
};

export default EmergencyFacility;
