import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { useSelector } from "react-redux";

import { request } from "../../utils/axios";
import { safetyTipsCategory } from "../../utils/categories";

import { AiFillLike, AiOutlineLike } from "react-icons/ai";

import Navbar from "../../components/Navbar";

const SafetyTips = () => {
  const { user, token } = useSelector((state) => state.auth);

  const [safetyTips, setSafetyTips] = useState([]);
  const [filteredSafetyTips, setFilteredSafetyTips] = useState([]);
  const [activeCategory, setActiveCategory] = useState(safetyTipsCategory[0]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchSafetyTips = async () => {
      try {
        const data = await request("/safety-tips/", "GET");
        const savedSafetyTips = data.map((safetyTip) => ({
          ...safetyTip,
          isSaved: safetyTip.saves.includes(user.id),
        }));
        setSafetyTips(savedSafetyTips);
        setFilteredSafetyTips(savedSafetyTips);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSafetyTips();
  }, []);

  const handleSavedSafetyTips = async (safetyTipsId) => {
    try {
      await request(`/safety-tips/saves/${safetyTipsId}`, "PUT", {
        Authorization: `Bearer ${token}`,
      });

      setFilteredSafetyTips((prevSafetyTip) =>
        prevSafetyTip.map((safetyTip) =>
          safetyTip._id === safetyTipsId
            ? { ...safetyTip, isSaved: !safetyTip.isSaved }
            : safetyTip
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (activeCategory === safetyTipsCategory[0]) {
      setFilteredSafetyTips(
        safetyTips.filter((safetyTip) =>
          safetyTip.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredSafetyTips(
        safetyTips.filter(
          (safetyTip) =>
            safetyTip.category.toLowerCase() === activeCategory.toLowerCase() &&
            safetyTip.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [activeCategory, searchQuery, safetyTips]);

  return (
    <>
      <Navbar />
      <br></br>
      <br></br>
      <Link to="/manage/safety-tips/add">Create</Link>

      <div>
        <Link to="/manage/safety-tips/saved">Saved Posts</Link>
      </div>
      <div>
        <input
          type="text"
          placeholder="Search safetyTips"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div>
        <div>
          {safetyTipsCategory.map((category) => (
            <span
              style={{ margin: "10px" }}
              key={category}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </span>
          ))}
        </div>
        {filteredSafetyTips.length > 0 ? (
          <div>
            {filteredSafetyTips.map((safetyTip) => (
              <div key={safetyTip._id}>
                <Link to={`/manage/safety-tips/${safetyTip._id}`}>
                  <img
                    src={`https://sagip-production.up.railway.app/images/Safety Tip/${safetyTip.image}`}
                    alt=""
                    style={{ width: "300px" }}
                  />
                </Link>
                <div>
                  <div>
                    <span>{safetyTip.category}</span>
                  </div>
                  <h4>{safetyTip.title}</h4>
                  <div>
                    {/* <span><span>Author:</span> {safetyTip.userId.username}</span> */}
                    {/* <span><span>Posted:</span> {format(safetyTip.createdAt)}</span> */}
                  </div>
                  <Link to={`/manage/safety-tips/${safetyTip._id}`}>
                    Read More
                  </Link>
                  {safetyTip.isSaved ? (
                    <div>
                      <AiFillLike
                        onClick={() => handleSavedSafetyTips(safetyTip._id)}
                      />
                    </div>
                  ) : (
                    <div>
                      <AiOutlineLike
                        onClick={() => handleSavedSafetyTips(safetyTip._id)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <h3>No safetyTips</h3>
        )}
      </div>
    </>
  );
};

export default SafetyTips;
