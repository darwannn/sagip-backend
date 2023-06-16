import React, { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { useSelector } from "react-redux";

import { request } from "../../utils/axios";

import { toast } from "react-toastify";
import moment from "moment";

import Navbar from "../../components/Navbar";

const VerificationRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [verificationRequest, setVerificationRequest] = useState([]);
  const [filteredVerificationRequest, setFilteredVerificationRequest] =
    useState([]);
  const [activeCategory, setActiveCategory] = useState("all");

  const { user, token } = useSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalShown, setisModalShown] = useState(false);
  const [verificationRequestDetails, setVerificationRequestDetails] =
    useState("");

  useEffect(() => {
    const fetchVerificationRequest = async () => {
      try {
        const data = await request("/auth/verification-request", "GET", {
          Authorization: `Bearer ${token}`,
        });

        /*  const filteredRecords = data.filter(
          (record) =>
            record.verificationPicture.length !== 0 &&
            record.status === "semi-verified" &&
            record.verificationRequestDate
        ); */

        console.log(data);

        setVerificationRequest(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchVerificationRequest();
  }, []);

  useEffect(() => {
    if (activeCategory === "all") {
      console.log("Filtering all requests");
      setFilteredVerificationRequest(
        verificationRequest.filter((request) =>
          request.firstname.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [activeCategory, searchQuery, verificationRequest]);

  useEffect(() => {
    const fetchVerificationRequestDetails = async () => {
      try {
        const data = await request(`/auth/verify-identity/${id}`, "GET", {
          Authorization: `Bearer ${token}`,
        });

        if (data.success) {
          setVerificationRequestDetails(data);
        } else {
          if (data.message !== "not found") {
            console.log(data);
          } else {
            navigate(`/manage/account/verification-request`);
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (id) {
      fetchVerificationRequestDetails();
      setisModalShown(true);
    } else {
      setisModalShown(false);
    }
  }, [id, token, isModalShown]);

  const handleReject = async (e) => {
    e.preventDefault();

    try {
      const data = await request(
        `/auth/verification-request/${id}`,
        "PUT",
        {
          Authorization: `Bearer ${token}`,
        },
        { action: "reject" }
      );
      const { success, message } = data;
      console.log(data);

      if (success) {
        toast.success(message);

        return;
      } else {
        toast.success(message);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const handleVerify = async (e) => {
    e.preventDefault();

    try {
      const data = await request(
        `/auth/verification-request/${id}`,
        "PUT",
        {
          Authorization: `Bearer ${token}`,
        },
        { action: "approve" }
      );
      const { success, message } = data;
      console.log(data);

      if (success) {
        toast.success(message);

        return;
      } else {
        toast.success(message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Navbar />

      <div>
        <div>Total Request: {verificationRequest.length}</div>
        <input
          type="text"
          placeholder="Search verificationRequest"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div>
        {filteredVerificationRequest.length > 0 ? (
          <div>
            {filteredVerificationRequest.map((safetyTip) => (
              <div key={safetyTip._id}>
                <div>
                  <div></div>
                  <Link
                    to={`/manage/account/verification-request/${safetyTip._id}`}
                  >
                    <h4>{`${safetyTip.firstname} ${
                      verificationRequestDetails &&
                      verificationRequestDetails.middlename
                        .split(" ")
                        .map((name) => name.charAt(0))
                        .join("")
                    }`}</h4>
                    <h4>
                      {moment(safetyTip.verificationRequestDate).format(
                        "MMMM DD, YYYY HH:mm A"
                      )}
                    </h4>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <h3>No Request</h3>
        )}
      </div>

      <br></br>
      <br></br>
      {isModalShown && (
        <>
          <Link to="/manage/account/resident">Go Back</Link>
          <div>
            {" "}
            Name:
            {`${verificationRequestDetails.firstname} ${
              verificationRequestDetails &&
              verificationRequestDetails.middlename
                .split(" ")
                .map((name) => name.charAt(0))
                .join("")
            } ${verificationRequestDetails.lastname}`}
          </div>
          <br></br>
          <div>
            {" "}
            Address:
            {`${verificationRequestDetails.street}, ${verificationRequestDetails.barangay}, ${verificationRequestDetails.municipality}`}
          </div>{" "}
          <br></br>
          <div>
            {" "}
            Contact Number: #{verificationRequestDetails.contactNumber}
          </div>{" "}
          <br></br>
          <div>
            {" "}
            Date of Birth{" "}
            {moment(verificationRequestDetails.birthdate).format(
              "MMMM DD, YYYY"
            )}
          </div>{" "}
          <br></br>
          <h4>
            Requested Created{" "}
            {moment(verificationRequestDetails.verificationRequestDate).format(
              "MMMM DD, YYYY HH:mm A"
            )}
          </h4>{" "}
          <br></br>
          <h4>
            Date Created
            {moment(verificationRequestDetails.createdAt).format(
              "MMMM DD, YYYY HH:mm A"
            )}
          </h4>
          {verificationRequestDetails.verificationPicture &&
            verificationRequestDetails.verificationPicture.map(
              (picture, index) => (
                <img
                  src={`http://localhost:5000/images/User/${picture}`}
                  key={index}
                  style={{ width: "300px" }}
                />
              )
            )}
          <button onClick={handleReject}>Reject Verification</button>
          <br></br>
          <button onClick={handleVerify}>Verify</button>
        </>
      )}
    </>
  );
};

export default VerificationRequest;
