import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { request } from "../../utils/axios";
import { safetyTipsCategory } from "../../utils/categories";
import Navbar from "../../components/Navbar";

const SafetyTips = () => {
  const { user, token } = useSelector((state) => state.auth);

  const [filteredHazardReport, setFilteredHazardReport] = useState([]);
  const [activeCategory, setActiveCategory] = useState(safetyTipsCategory[0]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchHazardReport = async () => {
      try {
        const data = await request("/assistance-request/ongoing", "GET", {
          Authorization: `Bearer ${token}`,
        });

        setFilteredHazardReport(
          data.filter((report) => report.status !== "resolved")
        );
      } catch (error) {
        console.error(error);
      }
    };
    fetchHazardReport();
  }, []);

  useEffect(() => {
    if (activeCategory === safetyTipsCategory[0]) {
      setFilteredHazardReport(
        filteredHazardReport.filter((report) =>
          report.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [activeCategory, searchQuery]);

  return (
    <>
      <Navbar />
      <br />
      <br />
      <Link to="/hazard/report">Submit a Report</Link>

      <div>
        {filteredHazardReport.length > 0 ? (
          <div>
            {filteredHazardReport.map((report) => (
              <div key={report._id}>
                <div>
                  <div>
                    <span>
                      {report.category} on {report.street} {report.municipality}
                    </span>
                  </div>
                  <h4>{report.title}</h4>
                  <Link to={`/hazard/map/${report._id}`}>View on Map</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <h3>No hazard reports</h3>
        )}
      </div>
    </>
  );
};

export default SafetyTips;
