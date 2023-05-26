import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import { request } from '../utils/axios';
import { format } from 'timeago.js';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux'

import { AiFillLike, AiOutlineLike } from 'react-icons/ai';
import { FiArrowRight } from 'react-icons/fi';
import Navbar from '../components/Navbar'
const SafetyTips = () => {
  const [safetyTips, setSafetyTips] = useState([]);
  const [filteredSafetyTips, setFilteredSafetyTips] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');

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
    const fetchSafetyTips = async () => {
      try {
        const data = await request('/safety-tips/', 'GET');
        const savedSafetyTips = data.map((safetyTip) => ({
          ...safetyTip,
          isLiked: safetyTip.saves.includes(user.id),
        }));
        setSafetyTips(savedSafetyTips);
        setFilteredSafetyTips(savedSafetyTips);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSafetyTips();
  }, []);

  useEffect(() => {

    
    if (activeCategory === 'all') {
      setFilteredSafetyTips(
        safetyTips.map((safetyTip) => ({
          ...safetyTip,
          isLiked: safetyTip.saves.includes(user.id),
        }))
      );
    } else {
      setFilteredSafetyTips((prev) => {
        const filteredSafetyTips = safetyTips.filter(
          (safetyTip) => safetyTip.category.toLowerCase() === activeCategory.toLowerCase()
        );

        return filteredSafetyTips.map((safetyTip) => ({
          ...safetyTip,
          isLiked: safetyTip.saves.includes(user.id),
        }));
      });
    }
  }, [activeCategory, safetyTips, user.id]);

  const handleSavedSafetyTips = async (safetyTipsId) => {
    try {
      const options = { Authorization: `Bearer ${token}` };
      await request(`/safety-tips/saves/${safetyTipsId}`, 'PUT', options);
      setFilteredSafetyTips((prevBlogs) =>
        prevBlogs.map((safetyTip) =>
          safetyTip._id === safetyTipsId ? { ...safetyTip, isLiked: !safetyTip.isLiked } : safetyTip
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredSafetyTips(safetyTips.filter((safetyTip) =>
        safetyTip.title.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setFilteredSafetyTips(safetyTips.filter((safetyTip) =>
        safetyTip.category.toLowerCase() === activeCategory.toLowerCase() &&
        safetyTip.title.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    }
  }, [activeCategory, searchQuery, safetyTips]);

  return (
    <>
    <Navbar />
        <h3>Select a category</h3>
        <div>
        <Link to="/safety-tips/saved">Liked Posts</Link>
      </div>
        <div>
        <input
  type="text"
  placeholder="Search safetyTips"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>
        
        </div>
        <div >
          <div >
            {categories.map((category) => (
              <span style={{margin:"10px"}}
                key={category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </span>
            ))}
          </div>
          {filteredSafetyTips.length > 0 ? (
            <div >
              {filteredSafetyTips.map((safetyTip) => (
                <div key={safetyTip._id} >
                  <Link to={`/safety-tips/${safetyTip._id}`}>
                    <img src={`http://localhost:5000/images/${safetyTip.photo}`} alt="Blog" style={{width:"300px"}}/>
                  </Link>
                  <div >
                    <div >
                      <span >{safetyTip.category}</span>
                    </div>
                    <h4>{safetyTip.title}</h4>
                    <div>
                      {/* <span><span>Author:</span> {safetyTip.userId.username}</span> */}
                      {/* <span><span>Posted:</span> {format(safetyTip.createdAt)}</span> */}
                    </div>
                    <Link to={`/safety-tips/${safetyTip._id}`} >
                      Read More <FiArrowRight />
                    </Link>
                    {safetyTip.isLiked ? (
                      <div >
                        <AiFillLike onClick={() => handleSavedSafetyTips(safetyTip._id)} />
                      </div>
                    ) : (
                      <div>
                        <AiOutlineLike onClick={() => handleSavedSafetyTips(safetyTip._id)} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <h3 >No safetyTips</h3>
          )}
        </div>
  
    </>
  );
};

export default SafetyTips;
