import { useState, useEffect } from "react";

import { Link, useParams, useNavigate } from "react-router-dom";

import { useSelector } from "react-redux";

import { request } from "../../utils/axios";
import { wellnessCategory } from "../../utils/categories";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import { AiOutlineCloseCircle } from "react-icons/ai";

import Navbar from "../../components/Navbar";

const WellnessSurveyInput = ({ type }) => {
  const { id } = useParams();

  const navigate = useNavigate();

  const { token } = useSelector((state) => state.auth);

  const [title, setTitle] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");
  /*   const [isActive, setIsActive] = useState(false); */
  const [category, setCategory] = useState("");

  useEffect(() => {
    console.log("Type");
    console.log(type);
    if (type === "update") {
      const fetchSafetyTipDetails = async () => {
        try {
          const options = {
            Authorization: `Bearer ${token}`,
          };
          const data = await request(`/wellness-survey/${id}`, "GET", options);

          setTitle(data.title);
          setEndDate(data.endDate);

          setCategory(data.category);
          /*      setIsActive(data.isActive); */
          setStatus(data.status);
        } catch (error) {
          console.error(error);
        }
      };
      fetchSafetyTipDetails();
    }
  }, [type, setTitle, setCategory, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      /*    const formData = new FormData();
      formData.append("title", title);
      
      formData.append("category", category); */

      let url, method;
      if (type === "add") {
        url = "/wellness-survey/add";
        method = "POST";
      } else if (type === "update") {
        url = `/wellness-survey/update/${id}`;
        method = "PUT";
      }

      const data = await request(
        url,
        method,
        {
          Authorization: `Bearer ${token}`,
        },
        {
          category,
          title,
          endDate,
          /*  isActive, */
          status,
        }
      );
      console.log(data);

      const { success, message } = data;
      if (success) {
        toast.success(message);
      } else {
        if (message !== "input error") {
          toast.error(message);
        } else {
          toast.error(message);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Navbar />
      <div>
        <div>
          <Link to="/manage/wellness-survey">Go Back</Link>
          <h2>{type === "add" ? "Add" : "Update"} Safety Tip</h2>
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div>
              <label>Title: </label>
              <input
                type="text"
                placeholder="Title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label>End Date: </label>
              <input
                type="date"
                placeholder="Date..."
                value={title}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <label>Content: </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="" hidden>
                  Select a category
                </option>
                {wellnessCategory.slice(1).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            {/*  <div>
              <label>Active</label>
              <input
                type="checkbox"
                onChange={(e) => setIsActive(e.target.checked)}
                checked={isActive}
              />
            </div> */}
            <div>
              <label>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="" hidden>
                  Select a category
                </option>

                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
            <div>
              <button type="submit">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default WellnessSurveyInput;
