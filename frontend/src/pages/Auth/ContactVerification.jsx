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

  const handleSubmit = async (e, action) => {
    console.log("====================================");
    console.log(newContactNumber);
    console.log("====================================");
    e.preventDefault();
    console.log("====================================");
    console.log(type);
    console.log("====================================");
    try {
      /*    const options = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }; */

      let method,
        url = "";

      if (action === "send" || type === "contact") {
        url = "/auth/contact-verification";
        method = "POST";
      } else if (action === "resend") {
        url = "/auth/resend-code";
        method = "PUT";
      }

      const data = await request(
        url,
        method,
        { Authorization: `Bearer ${token}` },
        { code, type }
      );
      console.log(data);

      const { success, message } = data;
      console.log(data);
      if (success) {
        if (message.includes("resent")) {
          toast.success(message);
        } else {
          if (type === "register") {
            navigate("/");
            dispatch(contactVerification(data));
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

  return (
    <>
      <h2>Contact Verification</h2>
      <form onSubmit={(e) => handleSubmit(e, "send")}>
        <input
          type="number"
          placeholder=""
          onChange={(e) => setCode(e.target.value)}
        />
        <button type="submit">Contact Verification</button>
      </form>
      <button onClick={(e) => handleSubmit(e, "resend")}>Resend Code</button>
    </>
  );
};

export default ContactVerification;
