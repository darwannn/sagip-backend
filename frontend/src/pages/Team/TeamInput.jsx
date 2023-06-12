import { useState, useEffect } from "react";

import { Link, useParams, useNavigate } from "react-router-dom";

import { useSelector } from "react-redux";

import { request } from "../../utils/axios";
import { safetyTipsCategory } from "../../utils/categories";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import { AiOutlineCloseCircle } from "react-icons/ai";

import Navbar from "../../components/Navbar";

const SafetyTipInput = ({ type }) => {
  const { id } = useParams();

  const navigate = useNavigate();

  const { token } = useSelector((state) => state.auth);

  const [responders, setResponders] = useState([]);

  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");

  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [headId, setHeadId] = useState("");
  const [membersId, setMembersId] = useState([]);

  const [teamMembersId, setTeamMembersId] = useState([]);

  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await request("/teams/", "GET");
        console.log(data);
        /* setResponders(
          data.filter((account) => teamMembersId.userType === "responder")
        ); */
        setResponders(data);
        console.log(responders);
      } catch (error) {
        console.error(error);
      }
    };
    fetchAccounts();

    if (type === "update") {
      const fetchSafetyTipDetails = async () => {
        try {
          const options = {
            Authorization: `Bearer ${token}`,
          };
          const data = await request(`/safety-tips/${id}`, "GET", options);

          setName(data.name);
          setContent(data.content);
          setCategory(data.category);
          setImageUrl(
            `https://sagip.onrender.com/images/Safety Tip/${data.image}`
          );
          console.log(data.category);
          console.log(category);
        } catch (error) {
          console.error(error);
        }
      };
      fetchSafetyTipDetails();
    }
  }, [type, setName, setContent, setCategory, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("content", content);
      formData.append("category", category);
      formData.append("hasChanged", hasChanged);
      formData.append("image", image);

      const options = {
        Authorization: `Bearer ${token}`,
      };

      let url, method;
      if (type === "add") {
        url = "/team/add";
        method = "POST";
      } else if (type === "update") {
        url = `/team/update/${id}`;
        method = "PUT";
      }

      const data = await request(url, method, options, formData, true);
      console.log(data);

      const { success, message } = data;
      if (success) {
        toast.success(message);
        navigate(
          `/manage/safety-tips/${type === "add" ? data.safetyTip._id : id}`
        );
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

  const onChangeFile = (e) => {
    setImage(e.target.files[0]);
    setImageName(e.target.files[0].name);
    setHasChanged(true);
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result);
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleCloseImage = () => {
    setImage(null);
    hasChanged(false);
    setImageName("");
    setImageUrl("");
  };

  return (
    <>
      <Navbar />
      <div>
        <div>
          <Link to="/manage/team">Go Back</Link>
          <h2>{type === "add" ? "Add" : "Update"} Safety Tip</h2>
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div>
              <label>name: </label>
              <input
                type="text"
                placeholder="Title..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {responders.map((responder, index) => {
              <>
                <input key={index} type="checkbox" name="responder" />
                {responder.firstname}
              </>;
            })}
          </form>
        </div>
      </div>
    </>
  );
};

export default SafetyTipInput;
