import React, { useState } from "react";

import { useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import { newPassword } from "../../redux/authSlice";

import { request } from "../../utils/axios";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const NewPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { token } = useSelector((state) => state.auth);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const handleNewPassword = async (e) => {
    e.preventDefault();
    try {
      const options = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const data = await request("/auth/new-password", "PUT", options, {
        password,
        confirmPassword,
        target: "new-password",
      });
      console.log(data);

      const { success, message } = data;
      if (success) {
        toast.success(message);
        dispatch(newPassword(data));
        navigate("/login");
      } else {
        if (message !== "input error") {
          toast.error(message);
        } else {
          // handle input message error here
          toast.error(message);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <h2>NewPassword</h2>
      <form onSubmit={handleNewPassword}>
        <input
          type="password"
          placeholder=""
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder=""
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button type="submit">Continue</button>
      </form>
    </>
  );
};

export default NewPassword;
