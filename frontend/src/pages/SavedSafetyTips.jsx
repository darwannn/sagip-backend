import React, { useEffect, useState } from 'react';
import { request } from '../utils/axios';

import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AiFillLike, AiOutlineLike } from 'react-icons/ai';
import { FiArrowRight } from 'react-icons/fi';

const SavedSafetyTips = () => {
  const [savedSafetyTips, setSavedSafetyTips] = useState([]);
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchLikedBlogs = async () => {
      try {
        const data = await request(`/safety-tips/saved/${user.id}`, 'GET', {
          Authorization: `Bearer ${token}`,
        });

        // Update savedSafetyTips data with isLiked property
        const updatedData = data.map((safetyTip) => ({
          ...safetyTip,
          isLiked: true,
        }));

        setSavedSafetyTips(updatedData);
      } catch (error) {
        console.error(error);
      }
    };

    fetchLikedBlogs();
  }, [user.id, token]);

  const handleLikePost = async (safetyTipId) => {
    try {
      const options = { Authorization: `Bearer ${token}` };
      await request(`/safety-tips/saves/${safetyTipId}`, 'PUT', options);

      // Remove the unliked safetyTip from the list
      setSavedSafetyTips((prevBlogs) => prevBlogs.filter((safetyTip) => safetyTip._id !== safetyTipId));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <h3>Liked Posts</h3>
      {savedSafetyTips.length > 0 ? (
        <div >
          {savedSafetyTips.map((safetyTip) => (
            <div key={safetyTip._id} >
              <Link to={`/safety-tips/${safetyTip._id}`}>
                <img src={`http://localhost:5000/images/${safetyTip.image}`} alt="Blog"  style={{width:"300px"}}/>
              </Link>
              <div >
                <div >
                  <span>{safetyTip.category}</span>
                </div>
                <h4>{safetyTip.title}</h4>
                <div >
                  {/* <span><span>Author:</span> {safetyTip.userId.username}</span> */}
                  {/* <span><span>Posted:</span> {format(safetyTip.createdAt)}</span> */}
                </div>
                <Link to={`/safety-tips/${safetyTip._id}`} >
                  Read More <FiArrowRight />
                </Link>
                {safetyTip.isLiked ? (
                  <div >
                    <AiFillLike onClick={() => handleLikePost(safetyTip._id)} />
                  </div>
                ) : (
                  <div>
                    <AiOutlineLike onClick={() => handleLikePost(safetyTip._id)} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <h3>No saved posts</h3>
      )}
    </>
  );
};

export default SavedSafetyTips;
