import { useState, useEffect } from 'react';

import { useParams,useNavigate, Link } from 'react-router-dom';

import { useSelector } from 'react-redux';

import { request } from '../../utils/axios';

import { format } from 'timeago.js';

import { AiFillEdit, AiFillLike, AiFillDelete, AiOutlineArrowRight, AiOutlineLike } from 'react-icons/ai';

import Navbar from '../../components/Navbar';


const SafetyTipDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);

  const [safetyTipDetails, setSafetyTipDetails] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchSafetyTipDetails = async () => {
      try {
        const options = { 'Authorization': `Bearer ${token}` };
        const data = await request(`/safety-tips/${id}`, 'GET', options);
       
  if(data.message != "not found") { 
console.log(data);
          setSafetyTipDetails(data);
        setIsSaved(data.saves.includes(user.id));

        } else {
          navigate(`/manage/safety-tips`);
        }

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
      await request(`/safety-tips/saves/${id}`, "PUT", options);
      setIsSaved((prev) => !prev);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Navbar />
      <div>
        <Link to="/manage/safety-tips">
          Go Back <AiOutlineArrowRight />
        </Link>
        <div>
          <img src={`http://localhost:5000/images/${safetyTipDetails.image}`} style={{ width: "300px" }} />
          <div>
            <h3>{safetyTipDetails.title}</h3>
            {safetyTipDetails.userId?._id === user.id ? (
              <div> {isSaved ? (
                <div>
                  <AiFillLike onClick={handleSavedSafetyTip} />
                </div>
              ) : (
                <div>
                  <AiOutlineLike onClick={handleSavedSafetyTip} />
                </div>
              )}</div>
              
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
              <span>contentription: </span>
              <span dangerouslySetInnerHTML={{ __html: safetyTipDetails.content }} />
            </p>
            <div>
              <span>{safetyTipDetails.views} views</span>
            </div>
          </div>
          <div>
            <span>
    
            </span>
            <span>
              <span>Created At:</span> {format(safetyTipDetails.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default SafetyTipDetails;
