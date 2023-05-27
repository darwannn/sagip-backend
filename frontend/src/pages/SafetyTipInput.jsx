import React from 'react';
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AiOutlineCloseCircle, AiOutlineArrowRight } from 'react-icons/ai';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Navbar from '../components/Navbar';
import { request } from '../utils/axios';

const Create = ({ type }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState('');
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
    setImageName(e.target.files[0].name);
  };

  const handleCloseImage = () => {
    setImage(null);
    setImageName('');
  };

  const handleAddSafetyTip = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('category', category);
   
        formData.append('image', image);
   
        const options = {
          Authorization: `Bearer ${token}`,
        };

        const data = await fetch("http://localhost:5000/safety-tips/add", {
            method: "POST",
            body: formData,
            headers: {
              Authorization: `Bearer ${token}`,
            },
        });

/* 
      const data = await request('/safety-tips/add', 'POST', options, formData); */
      console.log(data);


     /*  const data = await axios.post("http://localhost:5000/safety-tips/add", formData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}` */

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
        Authorization: `Bearer ${token}`,
      };

      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('category', category);
      
      const data = await request(`/safety-tips/update/${id}`, 'PUT', options, formData);

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
        <div>
          <Link to="/safety-tips">
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
              <ReactQuill value={content} onChange={setContent} readOnly={false} theme="snow" />
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
            </div>
            <div>
              <button type="submit">Submit form</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Create;
