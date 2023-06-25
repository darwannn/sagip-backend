import React, { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { useSelector } from "react-redux";

import { request } from "../../utils/axios";
import { safetyTipsCategory } from "../../utils/categories";

import { toast } from "react-toastify";
import moment from "moment";
import DataTable from "react-data-table-component";

import { AiFillEdit, AiFillDelete } from "react-icons/ai";
import { FiArrowRight } from "react-icons/fi";

import Navbar from "../../components/Navbar";

const SafetyTips = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { token, user } = useSelector((state) => state.auth);

  const [safetyTips, setSafetyTips] = useState([]);
  const [activeCategory, setActiveCategory] = useState(safetyTipsCategory[0]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchSafetyTips = async () => {
      try {
        /*    let option;
        user
          ? (option = {
              Authorization: `Bearer ${token}`,
            })
          : (option = {}); */

        const data = await request("/wellness-survey/", "GET", {
          Authorization: `Bearer ${token}`,
        });

        setSafetyTips(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSafetyTips();
  }, []);

  const filteredSafetyTips = safetyTips.filter((safetyTip) => {
    const categoryMatch =
      activeCategory === safetyTipsCategory[0] ||
      safetyTip.category.toLowerCase() === activeCategory.toLowerCase();
    const searchMatch = safetyTip.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return categoryMatch && searchMatch;
  });

  const handleDeleteBlog = async (id) => {
    try {
      const data = await request(`/wellness-survey/delete/${id}`, "DELETE", {
        Authorization: `Bearer ${token}`,
      });

      const { message, success } = data;
      if (success) {
        const updatedSafetyTips = safetyTips.filter((tip) => tip._id !== id);
        setSafetyTips(updatedSafetyTips);
        toast.success(message);
        navigate(`/manage/wellness-survey`);
      } else {
        toast.error(message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    {
      name: "Title",
      selector: (row) => row.title,
      sortable: true,
    },
    {
      name: "Category",
      selector: (row) => row.category,
      sortable: true,
    },
    {
      name: "Date",
      selector: (row) => moment(row.createdAt).format("MMMM DD, YYYY"),
      sortable: true,
    },
    {
      name: "Response",
      selector: (row) => row.affected.length + row.unaffected.length,
      sortable: true,
    },
    {
      name: "Affected",
      selector: (row) => row.affected.length,
      sortable: true,
    },
    {
      name: "Unaffected",
      selector: (row) => row.unaffected.length,
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <>
          <div>
            <Link to={`/manage/wellness-survey/update/${row._id}`}>
              <AiFillEdit />
            </Link>
            <div>
              <AiFillDelete onClick={() => handleDeleteBlog(row._id)} />
            </div>
            <></>
          </div>
        </>
      ),
    },
  ];

  return (
    <>
      <Navbar />
      <br />
      <br />
      <Link to="/manage/wellness-survey/add">Create</Link>

      <div>Published: {safetyTips.length}</div>
      <div>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div>
        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
          style={{ margin: "10px" }}
        >
          {safetyTipsCategory.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div>
        <DataTable
          columns={columns}
          data={filteredSafetyTips}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 20, 30]}
        />
      </div>
    </>
  );
};

export default SafetyTips;
