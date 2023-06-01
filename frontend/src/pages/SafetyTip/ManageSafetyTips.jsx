import React, { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { useSelector } from "react-redux";

import { request } from "../../utils/axios";
import { safetyTipsCategory } from "../../utils/categories";

import { toast } from "react-toastify";
import moment from "moment";
import DataTable from "react-data-table-component";

import {
  AiFillEdit,
  AiFillLike,
  AiFillDelete,
  AiOutlineArrowRight,
  AiOutlineLike,
} from "react-icons/ai";
import { FiArrowRight } from "react-icons/fi";

import Navbar from "../../components/Navbar";

const SafetyTips = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { token } = useSelector((state) => state.auth);

  const [safetyTips, setSafetyTips] = useState([]);
  const [activeCategory, setActiveCategory] = useState(safetyTipsCategory[0]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchSafetyTips = async () => {
      try {
        const data = await request("/safety-tips/", "GET");
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
      const options = { Authorization: `Bearer ${token}` };
      const data = await request(
        `/safety-tips/delete/${id}`,
        "DELETE",
        options
      );

      const { message, success } = data;
      if (success) {
        const updatedSafetyTips = safetyTips.filter((tip) => tip._id !== id);
        setSafetyTips(updatedSafetyTips);
        toast.success(message);
        navigate(`/manage/safety-tips`);
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
      name: "Actions",
      cell: (row) => (
        <>
          <Link to={`/manage/safety-tips/${row._id}`}>Read More</Link>
          <div>
            <Link to={`/manage/safety-tips/update/${row._id}`}>
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
      <Link to="/manage/safety-tips/add">Create</Link>

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
