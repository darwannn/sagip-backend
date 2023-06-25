import { useState, useEffect } from "react";

import { useParams, useNavigate, Link } from "react-router-dom";

import { useSelector } from "react-redux";

import { request } from "../../utils/axios";

import { AiFillLike, AiOutlineLike } from "react-icons/ai";

import Navbar from "../../components/Navbar";

const SafetyTipDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);

  const [safetyTipDetails, setSafetyTipDetails] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchSafetyTipDetails = async () => {
      try {
        const data = await request(`/safety-tips/${id}`, "GET");

        if (data.message !== "not found") {
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
      const options = { Authorization: `Bearer ${token}` };
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
        <Link to="/manage/safety-tips">Go Back</Link>
        <div>
          <img
            src={`https://res.cloudinary.com/dantwvqrv/image/upload/v1687689617/sagip/media/safety-tips/${safetyTipDetails.image}`}
            style={{ width: "300px" }}
          />
          <div>
            <h3>{safetyTipDetails.title}</h3>
            {user.userType === "admin" || user.userType === "super-admin" ? (
              <div>
                {" "}
                {isSaved ? (
                  <div>
                    <AiFillLike onClick={handleSavedSafetyTip} />
                  </div>
                ) : (
                  <div>
                    <AiOutlineLike onClick={handleSavedSafetyTip} />
                  </div>
                )}
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
              <span>contentription: </span>
              <span
                dangerouslySetInnerHTML={{ __html: safetyTipDetails.content }}
              />
            </p>
            {/*  <div>
              <span>{safetyTipDetails.views} views</span>
            </div> */}
          </div>
          <div>
            <span></span>
            <span>
              <span>Created At:</span> {safetyTipDetails.createdAt}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default SafetyTipDetails;
