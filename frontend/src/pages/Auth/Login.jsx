import { useState, useEffect } from "react";

import { Link, useNavigate } from "react-router-dom";

import { login, register } from "../../redux/authSlice";

import { setServerResponse } from "../../redux/serverResponseSlice";
import { useDispatch } from "react-redux";

import { request } from "../../utils/axios";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [idetifierErrorMessage, setIdetifierErrorMessage] = useState("");
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");

  const [identifier, setIdentifier] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (identifier) {
      /*   window.AndroidInterface.storeIdentifier(identifier); */
    }
  }, [identifier]);

  const handleLogin = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      const data = await request(
        "/auth/login",
        "POST",
        {},
        {
          identifier,
          password,
        }
      );

      console.log("Token:", data.token);
      console.log(data);
      const { success, message } = data;
      if (success) {
        dispatch(login(data));
        dispatch(setServerResponse(message));
        /*   toast.success(message); */
        window.AndroidInterface?.updateFcmToken(identifier);
        navigate("/");
      } else {
        if (message.toLowerCase() !== "input error") {
          if (message.includes("attempts")) {
            navigate("/login/contact-verification");
          }
          if (message.includes("verify")) {
            dispatch(register(data));
            navigate("/register/contact-verification");
          }
        } else {
          toast.error(message);

          setIdetifierErrorMessage(data.identifier);
          setPasswordErrorMessage(data.password);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Email or Number"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          style={{
            border: idetifierErrorMessage ? "1px solid red" : "1px solid black",
          }}
        />
        <span>{idetifierErrorMessage}</span>
        <input
          type="password"
          placeholder="Password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            border: passwordErrorMessage ? "1px solid red" : "1px solid black",
          }}
        />
        <span>{passwordErrorMessage}</span>
        <button type="submit">Login</button>
        <br></br>
        <p>
          Forgot Password? <Link to="/forgot-password">Forgot Password</Link>
        </p>
        <br></br>
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </>
  );
};

export default Login;
