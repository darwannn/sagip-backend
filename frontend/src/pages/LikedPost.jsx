import React, { useEffect, useState } from 'react';
import { request } from '../utils/fetchApi';
import { format } from 'timeago.js';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import classes from '../components/categories/categories.module.css';
import { AiFillLike, AiOutlineLike } from 'react-icons/ai';
import { FiArrowRight } from 'react-icons/fi';

const LikedPosts = () => {
  const [likedBlogs, setLikedBlogs] = useState([]);
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchLikedBlogs = async () => {
      try {
        const data = await request(`/blog/getLikedBlogs/${user._id}`, 'GET', {
          Authorization: `Bearer ${token}`,
        });

        // Update likedBlogs data with isLiked property
        const updatedData = data.map((blog) => ({
          ...blog,
          isLiked: true,
        }));

        setLikedBlogs(updatedData);
      } catch (error) {
        console.error(error);
      }
    };

    fetchLikedBlogs();
  }, [user._id, token]);

  const handleLikePost = async (blogId) => {
    try {
      const options = { Authorization: `Bearer ${token}` };
      await request(`/blog/likeBlog/${blogId}`, 'PUT', options);

      // Remove the unliked blog from the list
      setLikedBlogs((prevBlogs) => prevBlogs.filter((blog) => blog._id !== blogId));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h3>Liked Posts</h3>
      {likedBlogs.length > 0 ? (
        <div className={classes.blogs}>
          {likedBlogs.map((blog) => (
            <div key={blog._id} className={classes.blog}>
              <Link to={`/blogDetails/${blog._id}`}>
                <img src={`http://localhost:5000/images/${blog.photo}`} alt="Blog" />
              </Link>
              <div className={classes.blogData}>
                <div className={classes.categoryAndMetadata}>
                  <span className={classes.category}>{blog.category}</span>
                </div>
                <h4>{blog.title}</h4>
                <div className={classes.authorAndCreatedAt}>
                  {/* <span><span>Author:</span> {blog.userId.username}</span> */}
                  {/* <span><span>Posted:</span> {format(blog.createdAt)}</span> */}
                </div>
                <Link to={`/blogDetails/${blog._id}`} className={classes.readMore}>
                  Read More <FiArrowRight />
                </Link>
                {blog.isLiked ? (
                  <div className={classes.like}>
                    <AiFillLike onClick={() => handleLikePost(blog._id)} />
                  </div>
                ) : (
                  <div className={classes.like}>
                    <AiOutlineLike onClick={() => handleLikePost(blog._id)} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <h3>No liked posts</h3>
      )}
    </div>
  );
};

export default LikedPosts;
