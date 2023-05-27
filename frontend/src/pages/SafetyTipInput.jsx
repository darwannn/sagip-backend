import React from 'react';
import { useState, useEffect } from 'react';

import Navbar from '../components/Navbar';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { request } from '../utils/axios';
import { useParams } from 'react-router-dom';
import { AiFillEdit, AiFillLike, AiFillDelete, AiOutlineArrowRight, AiOutlineLike } from 'react-icons/ai';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const Create = ({ type }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('');
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);


  const categories = [
    'nature',
    'music',
    'travel',
    'design',
    'programming',
    'fun',
    'fashion',
  ];

  const onChangeFile = (e) => {
    setImage(e.target.files[0]);
  };

  const handleCloseImage = () => {
    setImage(null);
  };

 const handleAddSafetyTip = async (e) => {
  e.preventDefault();

  try {
    const formData = new FormData();

    let filename = null;
    if (image) {
      filename = crypto.randomUUID() + image.name;
      formData.append('filename', filename);
      formData.append('image', image);

      await fetch(`http://localhost:5000/upload`, {
        method: 'POST',
        body: formData,
      });
    }

    const options = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const body = {
      title,
      content,
      category,
      image: filename, // Add the uploaded image filename to the body
    };

    const data = await request('/safety-tips/add', 'POST', options, body);
    console.log(data);

    const { success, message } = data;
    if (success) {
      toast.success(message);

      navigate(`/safety-tips/${data.safetyTip._id}`);
    } else {
      if (message !== 'input error') {
        toast.error(message);
      } else {
        // handle input message error here
        toast.error(message);
      }
    }
  } catch (error) {
    console.error(error);
  }
};


  const { id } = useParams();

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
          console.log(data.category);
          console.log(category);
        } catch (error) {
          console.error(error);
        }
      };
      fetchSafetyTipDetails();
    }
  }, [id, type, setTitle, setContent, setCategory, token]);

  const handleUpdateSafetyTip = async (e) => {
    e.preventDefault();

    try {
      const options = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      const data = await request(`/safety-tips/update/${id}`, 'PUT', options, {
        title,
        content,
        category,
      });

      console.log(data);
      
      const { success, message } = data;
      if (success) {
        toast.success(message);

              navigate(`/safety-tips/${id}`);
      } else {
        if (message !== 'input error') {
          toast.error(message);
        } else {
          // handle input message error here
        }
      }

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Navbar />
      <div>
        <div >
        <Link to="/safety-tips">
          Go Back <AiOutlineArrowRight />
        </Link>
          <h2>{type} SafetyTip</h2>
          <form onSubmit={type === 'add' ? handleAddSafetyTip : handleUpdateSafetyTip} encType="multipart/form-data">
            <div >
              <label>Title: </label>
              <input
                type="text"
                placeholder="Title..."
                value={title} 
                
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div >
              <label>Description: </label>
       


              <ReactQuill
    value={content}
    onChange={setContent}
    readOnly={false} // Set to false if you want to enable editing
    theme="snow"
   
   
  />
            </div>
            <div >
              <label>Category: </label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((category) => (
                  <option key={crypto.randomUUID()} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div >
              <label htmlFor="image" >
                Image: <span>Upload here</span>
              </label>
              <input
                id="image"
                type="file"
                
                onChange={onChangeFile}
                style={{ display: 'none' }}
              />
              {image && (
                <p >
                  {image.name}{' '}
                  <AiOutlineCloseCircle  onClick={() => handleCloseImage()} />
                </p>
              )}
            </div>
            <div >
              <button  type="submit">
                Submit form
              </button>
            </div>
          </form>
        </div>
      </div>

    </>
  );
};

export default Create;