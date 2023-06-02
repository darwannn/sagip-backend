import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { useSelector } from "react-redux";

import { request } from "../../utils/axios";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "react-quill/dist/quill.snow.css";

import { AiOutlineCloseCircle } from "react-icons/ai";

import Navbar from "../../components/Navbar";

const AccountInput = ({ type }) => {
  const navigate = useNavigate();

  const { token, user } = useSelector((state) => state.auth);

  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [hasChanged, setHasChanged] = useState(false);

  const [email, setEmail] = useState("");
  /*   const [password, setPassword] = useState(""); */
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
  /*  const [contactNumber, setContactNumber] = useState(""); */

  const [attempt, setAttempt] = useState("");
  const [userType, setUserType] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    console.log(user);

    const fetchAccountDetails = async () => {
      try {
        const options = {
          Authorization: `Bearer ${token}`,
        };
        const data = await request(`/auth/${user.id}`, "GET", options);
        console.log(data);
        setEmail(data.email);
        /*      setPassword(data.password); */
        setRegion(data.region);
        setProvince(data.province);
        setMunicipality(data.municipality);
        setBarangay(data.barangay);
        setStreet(data.street);
        setFirstname(data.firstname);
        setMiddlename(data.middlename);
        setLastname(data.lastname);
        setGender(data.gender);
        setBirthdate(data.birthdate);
        /*     setContactNumber(data.contactNumber); */
        setStatus(data.status);
        setUserType(data.userType);
        setAttempt(data.attempt);
        setImage(data.profilePicture);
        setImageUrl(`http://localhost:5000/images/User/${data.profilePicture}`);
      } catch (error) {
        console.error(error);
      }
    };
    fetchAccountDetails();
  }, [type, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("id", user.id);
    formData.append("email", email);
    formData.append("region", region);
    formData.append("province", province);
    formData.append("municipality", municipality);

    formData.append("barangay", barangay);
    formData.append("street", street);
    formData.append("firstname", firstname);
    formData.append("middlename", middlename);

    formData.append("lastname", lastname);
    formData.append("gender", gender);
    formData.append("userType", userType);
    formData.append("birthdate", birthdate);
    formData.append("hasChanged", hasChanged);

    formData.append("image", image);

    /*   formData.append('contactNumber', contactNumber); */
    /*     formData.append('status', status);
    formData.append('verificationCode', verificationCode); */

    try {
      const options = { Authorization: `Bearer ${token}` };
      /*  const data = await request(url, method, options, formData); */
      const data = await request(
        `/auth/update/${user.id}`,
        "PUT",
        options,
        formData,
        true
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
    } catch (error) {
      console.error(error);
    }
  };

  const onChangeFile = (e) => {
    setImage(e.target.files[0]);
    setImageName(e.target.files[0].name);
    setHasChanged(true);
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result);
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleCloseImage = () => {
    setImage(null);
    setImageName("");
    setImageUrl("");
  };

  return (
    <>
      <Navbar />
      <div>
        <div>
          <h2>Update Personal Information</h2>
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <input
              type="email"
              placeholder="Email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="text"
              placeholder="Region..."
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
            <input
              type="text"
              placeholder="Province..."
              value={province}
              onChange={(e) => setProvince(e.target.value)}
            />
            <input
              type="text"
              placeholder="Municipality..."
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
            />
            <input
              type="text"
              placeholder="Barangay..."
              value={barangay}
              onChange={(e) => setBarangay(e.target.value)}
            />
            <input
              type="text"
              placeholder="Street..."
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
            <input
              type="text"
              placeholder="First Name..."
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
            />
            <input
              type="text"
              placeholder="Middle Name..."
              value={middlename}
              onChange={(e) => setMiddlename(e.target.value)}
            />
            <input
              type="text"
              placeholder="Last Name..."
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
            />
            <input
              type="text"
              placeholder="Gender..."
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            />
            <input
              type="text"
              placeholder="Birthdate..."
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
            />

            <div>
              <div>
                <label htmlFor="image">
                  Image: <span>Upload here</span>
                </label>
                <input id="image" type="file" onChange={onChangeFile} />
                {image && (
                  <p>
                    {imageName}{" "}
                    <AiOutlineCloseCircle onClick={() => handleCloseImage()} />
                  </p>
                )}
                {imageUrl && <img src={imageUrl} alt="Selected" />}
              </div>

              <button type="submit">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AccountInput;
