import { request } from "../../utils/axios";

import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { forgotPassword } from "../../redux/authSlice";
import { useDispatch } from "react-redux";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const data = await request(
        "/auth/forgot-password",
        "POST",
        {},
        {
          identifier,
        }
      );

      console.log("Token:", data.token);
      console.log(data);
      const { success, message } = data;
      if (success) {
        dispatch(forgotPassword(data));
        toast.success(message);
        navigate("/forgot-password/contact-verification");
      } else {
        if (message !== "input error") {
          toast.error(message);
        } else {
          // do input message error here
          toast.error(message);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <h2>Forgot Pass</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Email or Phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <button type="submit">Continue</button>
      </form>
    </>
  );
};

export default ForgotPassword;
