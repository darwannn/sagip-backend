import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { register } from "../../redux/authSlice";
import { useDispatch } from "react-redux";

import { request } from "../../utils/axios";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [barangay, setBarangay] = useState("");
  const [street, setStreet] = useState("");
  const [firstname, setFirstname] = useState("");
  const [middlename, setMiddlename] = useState("");
  const [lastname, setLastname] = useState("");
  const [gender, setGender] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const [isResident, setIsResident] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    /*  if (password !== confirmPassword) {
      console.log("Passwords do not match");
    } */

    try {
      const data = await request(
        "/auth/register",
        "POST",
        {},
        {
          email,
          password,
          confirmPassword,
          region,
          province,
          municipality,
          barangay,
          street,
          firstname,
          middlename,
          lastname,
          gender,
          /*        userType: "resident",
          status: "unverified", */
          birthdate,
          contactNumber,
        }
      );

      console.log(data);

      const { success, message } = data;
      if (success) {
        dispatch(register(data));
        toast.success(message);
        navigate("/register/contact-verification");
        return;
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

  const handleCheckboxChange = (e) => {
    setIsResident(e.target.checked);
    setMunicipality(e.target.checked && "Malolos");
    setRegion(e.target.checked && "Region III");
    setProvince(e.target.checked && "Bulacan");
  };

  return (
    <div>
      <div>
        <h2>Register</h2>
        <form onSubmit={handleRegister}>
          <div>
            <label>Malolos resident?</label>
            <input
              type="checkbox"
              onChange={handleCheckboxChange}
              checked={isResident}
            />
          </div>
          {!isResident && (
            <>
              <input
                type="text"
                placeholder="Region..."
                onChange={(e) => setRegion(e.target.value)}
              />
              <input
                type="text"
                placeholder="Province..."
                onChange={(e) => setProvince(e.target.value)}
              />
              <input
                type="text"
                placeholder="Municipality..."
                onChange={(e) => setMunicipality(e.target.value)}
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email..."
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password..."
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm Password..."
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <input
            type="text"
            placeholder="Barangay..."
            onChange={(e) => setBarangay(e.target.value)}
          />
          <input
            type="text"
            placeholder="Street..."
            onChange={(e) => setStreet(e.target.value)}
          />
          <input
            type="text"
            placeholder="First Name..."
            onChange={(e) => setFirstname(e.target.value)}
          />
          <input
            type="text"
            placeholder="Middle Name..."
            onChange={(e) => setMiddlename(e.target.value)}
          />
          <input
            type="text"
            placeholder="Last Name..."
            onChange={(e) => setLastname(e.target.value)}
          />
          <input
            type="text"
            placeholder="Gender..."
            onChange={(e) => setGender(e.target.value)}
          />
          <input
            type="text"
            placeholder="Birthdate..."
            onChange={(e) => setBirthdate(e.target.value)}
          />
          <input
            type="text"
            placeholder="Contact Number..."
            onChange={(e) => setContactNumber(e.target.value)}
          />
          <button type="submit">Register</button>
          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
