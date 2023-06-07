import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { useSelector } from "react-redux";

import { request } from "../../utils/axios";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "react-quill/dist/quill.snow.css";

import Navbar from "../../components/Navbar";

const PasswordVerification = () => {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      /*   const options = {
        Authorization: `Bearer ${token}`,
      }; */

      const data = await request(
        "/auth/password-verification",
        "POST",
        {
          Authorization: `Bearer ${token}`,
        },
        {
          password,
        }
      );

      const { success, message } = data;

      console.log(data);

      if (success) {
        toast.success(message);
        localStorage.setItem(
          "verification",
          JSON.stringify({
            isOwner: true,
            expiry: new Date().getTime() + 5 * 60 * 1000,
          })
        );
        navigate("/profile/password/edit");
        return;
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
          <h2>Current Password</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div>
              <button type="submit">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default PasswordVerification;
