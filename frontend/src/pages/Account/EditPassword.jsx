import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { useSelector } from "react-redux";

import { request } from "../../utils/axios";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "react-quill/dist/quill.snow.css";

import Navbar from "../../components/Navbar";

const EditPassword = () => {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const itemString = localStorage.getItem("verification");
  const item = JSON.parse(itemString);
  useEffect(() => {
    if (!itemString) {
      toast.error("please enter your password");
      navigate("/profile/password-verification");
    } else {
      if (new Date().getTime() > item.expiry) {
        localStorage.removeItem("verification");
        toast.error("please enter your password");
        navigate("/profile/password/password-verification");
      }
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const options = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      console.log(password);
      const data = await request("/auth/new-password", "PUT", options, {
        password,
        confirmPassword,
      });
      console.log(data);
      const { success, message } = data;
      if (success) {
        toast.success(message);
        localStorage.removeItem("verification");
        return;
      } else {
        if (message != "input error") {
          toast.success(message);
        } else {
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
          <h2>Update Password</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div>
              <input
                type="password"
                placeholder=""
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button type="submit">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditPassword;
