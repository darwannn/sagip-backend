import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { useSelector, useDispatch } from "react-redux";
import { newEmail } from "../../redux/authSlice";

import { request } from "../../utils/axios";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "react-quill/dist/quill.snow.css";

import Navbar from "../../components/Navbar";

const EditEmail = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");

  useEffect(() => {
    console.log(user);

    const fetchAccountDetails = async () => {
      try {
        const data = await request(`/account/${user.id}`, "GET", {
          Authorization: `Bearer ${token}`,
        });
        console.log(data);

        setEmail(data.email);
      } catch (error) {
        console.error(error);
      }
    };
    fetchAccountDetails();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      dispatch(newEmail(email));
      //account/update/${action}/contact-verification
      const data = await request(
        `/account/update/email/send-code`,
        "PUT",
        {
          Authorization: `Bearer ${token}`,
        },
        {
          email,
        }
      );
      const { success, message } = data;
      console.log(data);

      if (success) {
        toast.success(message);
        navigate("/profile/email/contact-verification");
        return;
      } else {
        toast.error(message);
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
          <h2>Update Email</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Contact Number..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

export default EditEmail;
