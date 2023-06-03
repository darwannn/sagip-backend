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
        const data = await request("/hazard-report/", "GET");
        setSafetyTips(data);
        setFilteredSafetyTips(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSafetyTips();
  }, []);

  useEffect(() => {
    if (activeCategory === safetyTipsCategory[0]) {
      setFilteredSafetyTips(
        safetyTips.filter((safetyTip) =>
          safetyTip.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [activeCategory, searchQuery, safetyTips]);

  return (
    <>
      <Navbar />
      <br></br>
      <br></br>
      <Link to="/hazard/report">Submit a Report</Link>

      <div>
        {filteredSafetyTips.length > 0 ? (
          <div>
            {filteredSafetyTips.map((safetyTip) => (
              <div key={safetyTip._id}>
                {/*   <Link to={`/manage/safety-tips/${safetyTip._id}`}>
                  <img
                    src={`http://localhost:5000/images/Safety Tip/${safetyTip.image}`}
                    alt=""
                    style={{ width: "300px" }}
                  />
                </Link> */}
                <div>
                  <div>
                    <span>{safetyTip.category}</span>
                  </div>
                  <h4>{safetyTip.title}</h4>

                  <Link to={`/hazard/map/${safetyTip._id}`}>View on Map</Link>
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
