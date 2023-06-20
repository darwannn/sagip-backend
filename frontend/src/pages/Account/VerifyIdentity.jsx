import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { request } from "../../utils/axios";
import { toast } from "react-toastify";

function VerifyIdentity() {
  const navigate = useNavigate();
  const [selfieImage, setSelfieImage] = useState(null);
  const { token, user } = useSelector((state) => state.auth);
  const [alreadyRequested, setAlreadyRequested] = useState(false);

  useEffect(() => {
    console.log(user);

    const fetchAccountDetails = async () => {
      try {
        const options = {
          Authorization: `Bearer ${token}`,
        };
        const data = await request(
          `/auth/verify-identity/request/${user.id}`,
          "GET",
          options
        );

        console.log(data);

        if (data.success) {
        } else {
          if (data.message.includes("not found")) {
            navigate("/");
          }
          if (data.message.includes("pending")) {
            // pag may request na
            setAlreadyRequested(true);
          }
        }

        if (data.status === "verified") {
          navigate("/");
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchAccountDetails();
  }, [token, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    if (selfieImage) {
      formData.append("selfieImage", selfieImage, "selfie.png");
    }

    try {
      const options = { Authorization: `Bearer ${token}` };
      const data = await request(
        `/auth/verify-identity`,
        "PUT",
        options,
        formData
      );

      console.log(data);
      const { success, message } = data;

      if (success) {
        toast.success(message);
        return;
      } else {
        if (message !== "input error") {
          toast.error(message);
          // navigate(0);
        } else {
          toast.error(message);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      {alreadyRequested ? (
        <>We are verifying your request...</>
      ) : (
        <>
          <h2>Verify Identity</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="file"
              accept="image/*"
              capture="camera"
              onChange={(e) => setSelfieImage(e.target.files[0])}
            />
            {selfieImage && (
              <img
                src={URL.createObjectURL(selfieImage)}
                alt="Captured selfie"
                width="200"
                height="150"
              />
            )}
            <button type="submit">Submit</button>
          </form>
        </>
      )}
    </div>
  );
}

export default VerifyIdentity;
