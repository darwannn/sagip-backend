import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import { request } from '../../utils/fetchApi';
import { format } from 'timeago.js';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux'
import classes from './categories.module.css';
import { MdOutlinePreview } from 'react-icons/md';
import { AiFillLike, AiOutlineLike } from 'react-icons/ai';
import { FiArrowRight } from 'react-icons/fi';

const Categories = () => {
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { user, token } = useSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState('');


  const categories = [
    'all',
    'nature',
    'music',
    'travel',
    'design',
    'programming',
    'fun',
    'fashion',
  ];

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const data = await request('/blog/getAll', 'GET');
        const blogsWithLikeStatus = data.map((blog) => ({
          ...blog,
          isLiked: blog.likes.includes(user._id),
        }));
        setBlogs(blogsWithLikeStatus);
        setFilteredBlogs(blogsWithLikeStatus);
      } catch (error) {
        console.error(error);
      }
    };
    fetchBlogs();
  }, []);

  useEffect(() => {

    
    if (activeCategory === 'all') {
      setFilteredBlogs(
        blogs.map((blog) => ({
          ...blog,
          isLiked: blog.likes.includes(user._id),
        }))
      );
    } else {
      setFilteredBlogs((prev) => {
        const filteredBlogs = blogs.filter(
          (blog) => blog.category.toLowerCase() === activeCategory.toLowerCase()
        );

        return filteredBlogs.map((blog) => ({
          ...blog,
          isLiked: blog.likes.includes(user._id),
        }));
      });
    }
  }, [activeCategory, blogs, user._id]);

  const handleLikePost = async (blogId) => {
    try {
      const options = { Authorization: `Bearer ${token}` };
      await request(`/blog/likeBlog/${blogId}`, 'PUT', options);
      setFilteredBlogs((prevBlogs) =>
        prevBlogs.map((blog) =>
          blog._id === blogId ? { ...blog, isLiked: !blog.isLiked } : blog
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredBlogs(blogs.filter((blog) =>
        blog.title.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setFilteredBlogs(blogs.filter((blog) =>
        blog.category.toLowerCase() === activeCategory.toLowerCase() &&
        blog.title.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    }
  }, [activeCategory, searchQuery, blogs]);

  return (
    <div className={classes.container}>
      <div className={classes.wrapper}>
        <h3>Select a category</h3>
        <div>
        <Link to="/likedPosts">Liked Posts</Link>
      </div>
        <div className={classes.searchBar}>
        <input
  type="text"
  placeholder="Search blogs"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>
        
        </div>
        <div className={classes.categoriesAndBlogs}>
          <div className={classes.categories}>
            {categories.map((category) => (
              <span
                key={category}
                className={`${classes.category} ${
                  activeCategory === category && classes.active
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </span>
            ))}
          </div>
          {filteredBlogs.length > 0 ? (
            <div className={classes.blogs}>
              {filteredBlogs.map((blog) => (
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
            <h3 className={classes.noBlogsMessage}>No blogs</h3>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories;
