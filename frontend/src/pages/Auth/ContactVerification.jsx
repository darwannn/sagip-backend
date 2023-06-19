import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { contactVerification } from "../../redux/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { request } from "../../utils/axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ContactVerification = ({ type }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, newContactNumber } = useSelector((state) => state.auth);
  const [code, setCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await request(
        "/auth/contact-verification",
        "POST",
        { Authorization: `Bearer ${token}` },
        { code, type }
      );

      const { success, message } = data;
      console.log("====================================");
      console.log(data);
      console.log("====================================");
      if (success) {
        if (type === "register") {
          navigate("/");
          dispatch(contactVerification(data));
          window.AndroidInterface?.updateFcmToken(data.user.email);
          toast.success(message);
        } else if (type === "forgot-password") {
          navigate("/new-password");
          dispatch(contactVerification(data));
          toast.success(message);
        } else if (type === "login") {
          navigate("/login");
          dispatch(contactVerification(data));
          toast.success(message);
        } else if (type === "contact") {
          console.log("====================================");
          console.log("new contact?");
          console.log("====================================");
          const data = await request(
            `/account/update/contact-number`,
            "PUT",
            { Authorization: `Bearer ${token}` },
            { contactNumber: newContactNumber }
          );
          const { success, message } = data;
          console.log(data);

          if (success) {
            toast.success(message);

            return;
          } else {
            if (message != "input error") {
              toast.success(message);
            } else {
            }
          }
        }
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
  const handleResend = async () => {
    try {
      const data = await request(
        "/auth/resend-code",
        "PUT",
        { Authorization: `Bearer ${token}` } /* ,
        { code, type } */
      );
      console.log(data);

      const { success, message } = data;
      console.log(data);
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
      <h2>Contact Verification</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder=""
          onChange={(e) => setCode(e.target.value)}
        />
        <button type="submit">Contact Verification</button>
      </form>
      <button onClick={handleResend}>Resend Code</button>
    </>
  );
};

export default ContactVerification;
