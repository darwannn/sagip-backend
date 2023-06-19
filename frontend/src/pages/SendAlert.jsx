import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { request } from "../utils/axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SendAlert = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [location, setLocation] = useState([]);
  const [specific, setSpecific] = useState(false);

  const handleLocationChange = (e) => {
    const { value, checked } = e.target;

    if (checked) {
      setLocation((prevLocation) => [...prevLocation, value]);
    } else {
      setLocation((prevLocation) =>
        prevLocation.filter((loc) => loc !== value)
      );
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await request(
        "/api/send-alert",
        "POST",
        { Authorization: `Bearer ${token}` },
        {
          alertMessage,
          alertTitle,
          location: specific ? location : ["All"],
        }
      );
      console.log(data);
      const { success, message } = data;
      console.log(message);
      if (success) {
        toast.success(message);
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
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        {/* Radio buttons for location options */}
        <label>
          <input
            type="radio"
            value="All"
            checked={!specific}
            onChange={() => {
              setSpecific(false);
            }}
          />
          All
        </label>
        <label>
          <input
            type="radio"
            value="Specific"
            checked={specific}
            onChange={() => setSpecific(true)}
          />
          Specific
        </label>

        {/* Checkbox for selecting specific barangays */}
        {specific && (
          <>
            <label>
              <input
                type="checkbox"
                value="Dakila"
                checked={location.includes("Dakila")}
                onChange={handleLocationChange}
              />
              Dakila
            </label>
            <label>
              <input
                type="checkbox"
                value="Guinhawa"
                checked={location.includes("Guinhawa")}
                onChange={handleLocationChange}
              />
              Guinhawa
            </label>
            <label>
              <input
                type="checkbox"
                value="San Pablo"
                checked={location.includes("San Pablo")}
                onChange={handleLocationChange}
              />
              San Pablo
            </label>
          </>
        )}

        <input
          type="text"
          placeholder="title..."
          value={alertTitle}
          onChange={(e) => setAlertTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="message..."
          value={alertMessage}
          onChange={(e) => setAlertMessage(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
    </>
  );
};

export default SendAlert;
