import React from 'react';
import { useState, useEffect } from 'react';

import Navbar from '../../components/navbar/Navbar';
import classes from './create.module.css';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { request } from '../../utils/fetchApi';
import { useParams } from 'react-router-dom';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const Create = ({ mode }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [img, setImg] = useState('');
  const [category, setCategory] = useState('');
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [blogDetails, setBlogDetails] = useState('');

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
    setImg(e.target.files[0]);
  };

  const handleCloseImg = () => {
    setImg(null);
  };

  const handleCreateBlog = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      let filename = null;
      if (img) {
        filename = crypto.randomUUID() + img.name;
        formData.append('filename', filename);
        formData.append('image', img);

        await fetch(`http://localhost:5000/upload`, {
          method: 'POST',
          body: formData,
        });
      } else {
        return;
      }

      const options = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const body = {
        title,
        desc,
        category,
        photo: filename,
      };

      const data = await request('/blog', 'POST', options, body);
      navigate(`/blogDetails/${data._id}`);
    } catch (error) {
      console.error(error);
    }
  };

  const { id } = useParams();

  useEffect(() => {
    if (mode === 'update') {
      const fetchBlogDetails = async () => {
        try {
          const options = {
            Authorization: `Bearer ${token}`,
          };
          const data = await request(`/blog/find/${id}`, 'GET', options);
          setBlogDetails(data);
          setTitle(data.title);
          setDesc(data.desc);
          setCategory(data.category);
          console.log(data.category);
          console.log(category);
        } catch (error) {
          console.error(error);
        }
      };
      fetchBlogDetails();
    }
  }, [id, mode, setBlogDetails, setTitle, setDesc, setCategory, token]);

  const handleUpdateBlog = async (e) => {
    e.preventDefault();

    try {
      const options = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      await request(`/blog/updateBlog/${id}`, 'PUT', options, {
        title,
        desc,
        category,
      });
      navigate(`/blogDetails/${id}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Navbar />
      <div className={classes.container}>
        <div className={classes.wrapper}>
          <h2 className={classes.title}>{mode} Blog</h2>
          <form onSubmit={mode === 'create' ? handleCreateBlog : handleUpdateBlog} encType="multipart/form-data">
            <div className={classes.inputWrapper}>
              <label>Title: </label>
              <input
                type="text"
                placeholder="Title..."
                value={title} // Removed template literal and backticks
                className={classes.input}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className={classes.inputWrapper}>
              <label>Description: </label>
       


              <ReactQuill
    value={desc}
    onChange={setDesc}
    readOnly={false} // Set to false if you want to enable editing
    theme="snow"
    style={{ height: '300px' }}
    className={classes.input}
  />
            </div>
            <div className={classes.inputWrapperSelect}>
              <label>Category: </label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((category) => (
                  <option key={crypto.randomUUID()} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className={classes.inputWrapperImg}>
              <label htmlFor="image" className={classes.labelFileInput}>
                Image: <span>Upload here</span>
              </label>
              <input
                id="image"
                type="file"
                className={classes.input}
                onChange={onChangeFile}
                style={{ display: 'none' }}
              />
              {img && (
                <p className={classes.imageName}>
                  {img.name}{' '}
                  <AiOutlineCloseCircle className={classes.closeIcon} onClick={() => handleCloseImg()} />
                </p>
              )}
            </div>
            <div className={classes.buttonWrapper}>
              <button className={classes.submitBtn} type="submit">
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
