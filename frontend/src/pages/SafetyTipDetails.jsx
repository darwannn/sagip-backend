import React from 'react';
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { request } from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { format } from 'timeago.js';
import { AiFillEdit, AiFillLike, AiFillDelete, AiOutlineArrowRight, AiOutlineLike } from 'react-icons/ai';
import { toast } from 'react-toastify';

const SafetyTipDetails = () => {
  const [safetyTipDetails, setSafetyTipDetails] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const { id } = useParams();
  const { user, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSafetyTipDetails = async () => {
      try {
        const options = { 'Authorization': `Bearer ${token}` };
        const data = await request(`/safety-tips/${id}`, 'GET', options);
        setSafetyTipDetails(data);
        setIsSaved(data.saves.includes(user.id));
      } catch (error) {
        console.error(error);
      }
    };
    fetchSafetyTipDetails();
  }, [id]);

  // like
  const handleSavedSafetyTip = async () => {
    try {
      const options = { "Authorization": `Bearer ${token}` };
      await request(`/safety-tips/saved/${id}`, "PUT", options);
      setIsSaved((prev) => !prev);
    } catch (error) {
      console.error(error);
    }
  };

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

  return (
    <>
      <Navbar />
      <div>
        <Link to="/safety-tips">
          Go Back <AiOutlineArrowRight />
        </Link>
        <div>
          <img src={`http://localhost:5000/images/${safetyTipDetails?.image}`} style={{ width: "300px" }} />
          <div>
            <h3>{safetyTipDetails?.title}</h3>
            {safetyTipDetails?.userId?._id === user.id ? (
              <div>
                <Link to={`/safety-tips/update/${safetyTipDetails?._id}`}>
                  <AiFillEdit />
                </Link>
                <div>
                  <AiFillDelete onClick={handleDeleteBlog} />
                </div>
                <>
                {isSaved ? (
                  <div>
                    <AiFillLike onClick={handleSavedSafetyTip} />
                  </div>
                ) : (
                  <div>
                    <AiOutlineLike onClick={handleSavedSafetyTip} />
                  </div>
                )}
              </>
              </div>
              
            ) : (
              <>
                {isSaved ? (
                  <div>
                    <AiFillLike onClick={handleSavedSafetyTip} />
                  </div>
                ) : (
                  <div>
                    <AiOutlineLike onClick={handleSavedSafetyTip} />
                  </div>
                )}
              </>
            )}
          </div>
          <div>
            <p>
              <span>Description: </span>
              <span dangerouslySetInnerHTML={{ __html: safetyTipDetails?.desc }} />
            </p>
            <div>
              <span>{safetyTipDetails?.views} views</span>
              <span>{safetyTipDetails?.saves?.length} saves</span>
            </div>
          </div>
          <div>
            <span>
              {/* <span>Author:</span> {safetyTipDetails?.userId?.username} */}
            </span>
            <span>
              <span>Created At:</span> {format(safetyTipDetails?.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default SafetyTipDetails;
