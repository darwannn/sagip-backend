import React, { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { request } from '../../utils/axios';

import { AiFillLike, AiOutlineLike } from 'react-icons/ai';
import { FiArrowRight } from 'react-icons/fi';

const SavedSafetyTips = () => {
  const { user, token } = useSelector((state) => state.auth);

  const [savedSafetyTips, setSavedSafetyTips] = useState([]);

  useEffect(() => {
    const fetchSavedSafetyTips = async () => {
      try {
        const data = await request(`/safety-tips/saved/${user.id}`, 'GET', {
          Authorization: `Bearer ${token}`,
        });
        const updatedData = data.map((safetyTip) => ({
          ...safetyTip,
        }));

        setSavedSafetyTips(updatedData);
      } catch (error) {
        console.error(error);
      }
    };

    fetchSavedSafetyTips();
  }, [user.id, token]);


  /* repeated code from safetytips.jsx */
  const handleSavedSafetyTips = async (safetyTipId) => {
    try {
      const options = { Authorization: `Bearer ${token}` };
      await request(`/safety-tips/saves/${safetyTipId}`, 'PUT', options);
      setSavedSafetyTips((prevBlogs) => prevBlogs.filter((safetyTip) => safetyTip._id !== safetyTipId));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <h3>Saved Tips</h3>
      {savedSafetyTips.length > 0 ? (
        <div >
          {savedSafetyTips.map((safetyTip) => (
            <div key={safetyTip._id} >
              <Link to={`/manage/safety-tips/${safetyTip._id}`}>
                <img src={`http://localhost:5000/images/${safetyTip.image}`} alt="Blog"  style={{width:"300px"}}/>
              </Link>
              <div >
                <div >
                  <span>{safetyTip.category}</span>
                </div>
                <h4>{safetyTip.title}</h4>
                <Link to={`/manage/safety-tips/${safetyTip._id}`} >
                  Read More <FiArrowRight />
                </Link>
        
                  <div >
                    <AiFillLike onClick={() => handleSavedSafetyTips(safetyTip._id)} />
                  </div>
            
              </div>
            </div>
          ))}
        </div>
      ) : (
        <h3>No saved Tips</h3>
      )}
    </>
  );
};

export default SavedSafetyTips;
