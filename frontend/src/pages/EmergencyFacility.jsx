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
    
    useEffect(() => {
      const fetchSafetyTipDetails = async () => {
        console.log('====================================');
        console.log("LOG");
        console.log(id);
        console.log('====================================');
        try {
          const options = { 'Authorization': `Bearer ${token}` };
          const data = await request(`/safety-tips/${id}`, 'GET', options);
          setSafetyTipDetails(data);
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
    }, [id, token]);
    
    // Rest of the component code...
    
  
    // delete
    const handleDeleteBlog = async () => {
      try {
        const options = { "Authorization": `Bearer ${token}` };
        const data = await request(`/safety-tips/delete/${id}`, "DELETE", options);
        const { message } = data;
        toast.success(message);
        navigate(`/safety-tips`);
      } catch (error) {
        console.error(error);
      }
    };

/* ____________________________________ */


const [type, setType] = useState('update');
const [title, setTitle] = useState('');
const [content, setContent] = useState('');
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


const handleAddSafetyTip = async (e) => {
  e.preventDefault();

  try {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    formData.append('hasChanged', hasChanged);
 
      formData.append('image', image);
 
      const options = {
        Authorization: `Bearer ${token}`,
      };

    
const data = await request("/safety-tips/add", "POST", options, formData, true);
/* 
    const data = await request('/safety-tips/add', 'POST', options, formData); */
    console.log(data);


    const { success, message } = data;
    if (success) {
      toast.success(message);
      navigate(`/safety-tips/${data.safetyTip._id}`);
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
        const data = await request(`/safety-tips/${id}`, 'GET', options);

        setTitle(data.title);
        setContent(data.content);
        setCategory(data.category);
        setImageUrl(`http://localhost:5000/images/${data.image}`);
        console.log(data.category);
        console.log(category);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSafetyTipDetails();
  }
}, [id, setTitle, setContent, setCategory, token]);

const handleUpdateSafetyTip = async (e) => {
  e.preventDefault();

  try {
  
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    formData.append('hasChanged', hasChanged);
 
      formData.append('image', image);
 
      const options = {
        Authorization: `Bearer ${token}`,
      };

    
      const data = await request(`/safety-tips/update/${id}`, "PUT", options, formData,true);

/* 
    const data = await request('/safety-tips/add', 'POST', options, formData); */
    console.log(data);



    const { success, message } = data;
    if (success) {
      toast.success(message);
    /*   navigate(`/safety-tips/${id}`); */
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

  const [EmergencyFacility, setEmergencyFacility] = useState([]);
  const [filteredEmergencyFacility, setFilteredEmergencyFacility] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const { user } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = [
    'All',
    'Police',
    'Fire Station',
    'Hospital',
    'Evacuation Area',
  ];

  useEffect(() => {
    
    console.log('====================================');
    console.log(id);
    console.log('====================================');

    const fetchEmergencyFacility = async () => {
      try {
        const data = await request('/safety-tips/', 'GET');
        setEmergencyFacility(data);
        setFilteredEmergencyFacility(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchEmergencyFacility();

  }, []);

  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredEmergencyFacility(EmergencyFacility);
    } else {
      setFilteredEmergencyFacility(EmergencyFacility.filter((emergencyFacility) =>
        emergencyFacility.category.toLowerCase() === activeCategory.toLowerCase()
      ));
    }
  }, [activeCategory, EmergencyFacility]);

  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredEmergencyFacility(EmergencyFacility.filter((emergencyFacility) =>
        emergencyFacility.title.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setFilteredEmergencyFacility(EmergencyFacility.filter((emergencyFacility) =>
        emergencyFacility.category.toLowerCase() === activeCategory.toLowerCase() &&
        emergencyFacility.title.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    }
  }, [activeCategory, searchQuery, EmergencyFacility]);

  return (
    <>
      <Navbar />
      <br></br>
      <br></br>
      <Link to="/emergency-facility/add" onClick={() => {setisModalShown(true); setType("add")}}>
  Add
</Link>

      <div>
        <input
          type="text"
          placeholder="Search EmergencyFacility"
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
      <Link to={`/emergency-facility/${emergencyFacility._id}`} key={emergencyFacility._id}>
        <div>
          <div>
            <span>{emergencyFacility.category}</span>
          </div>
          <h4>{emergencyFacility.title}</h4>
        </div>
        <br></br>
      </Link>
    ))}
  </div>
) : (
  <h3>No EmergencyFacility</h3>
)}

      
      
      <br></br>
      <br></br>
      <br></br>
      <br></br>

      { isModalShown && (
  <>
    {/* <Link to="/emergency-facility">
      Close <AiOutlineArrowRight />
    </Link>
    <div>
      <img src={`http://localhost:5000/images/${safetyTipDetails?.image}`} style={{ width: "300px" }} />
      <div>
        <h3>{safetyTipDetails?.title}</h3>
        {safetyTipDetails?.userId?._id === user.id && (
          <div>
            <Link to={`/safety-tips/update/${safetyTipDetails?._id}`}>
              <AiFillEdit />
            </Link>
            <div>
              <AiFillDelete onClick={handleDeleteBlog} />
            </div>
          </div>
        )}
      </div>
      <div>
        <p>
          <span>contentription: </span>
          <span dangerouslySetInnerHTML={{ __html: safetyTipDetails?.content }} />
        </p>
        <div>
          <span>{safetyTipDetails?.views} views</span>
          <span>{safetyTipDetails?.saves?.length} saves</span>
        </div>
      </div>
      <div>
        <span>
          <span>Created At:</span> {format(safetyTipDetails?.createdAt)}
        </span>
      </div>
    </div> */}
    <div>
        <div>
          <Link to="/emergency-facility">
            Go Back <AiOutlineArrowRight />
          </Link>
          <h2>{type} SafetyTip</h2>
          <form onSubmit={type === 'add' ? handleAddSafetyTip : handleUpdateSafetyTip} encType="multipart/form-data">
            <div>
              <label>Title: </label>
              <input type="text" placeholder="Title..." value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label>Description: </label>
              <input type="text" placeholder="Title..." value={content} onChange={setContent} />
              
            
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
