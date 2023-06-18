import React, { useEffect, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { useSelector } from "react-redux";

import { request } from "../../utils/axios";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import moment from "moment";

import Navbar from "../../components/Navbar";

import {
  AiFillDelete,
  AiFillEdit,
  AiOutlineArrowRight,
  AiOutlineCloseCircle,
} from "react-icons/ai";

const ManageTeam = ({ type }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [verificationRequest, setVerificationRequest] = useState([]);
  const [filteredVerificationRequest, setFilteredVerificationRequest] =
    useState([]);
  const [activeCategory, setActiveCategory] = useState("all");

  const { user, token } = useSelector((state) => state.auth);

  const [name, setName] = useState("");

  const [head, setHead] = useState("");
  const [teamId, setTeamId] = useState("");
  const [member, setMember] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalShown, setisModalShown] = useState(false);
  const [verificationRequestDetails, setVerificationRequestDetails] =
    useState("");
  const [shouldFetchData, setShouldFetchData] = useState(true);

  const [responders, setResponders] = useState([]);
  const [unassignedResponders, setUnassignedResponders] = useState([]);
  const [assignedResponders, setAssignedResponders] = useState([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const unassigneddata = await request(
          "/team/responder/unassigned",
          "GET"
        );

        const responderdata = await request("/team/responder", "GET");

        const assigneddata = await request("/team/responder/assigned", "GET");
        console.log("====================================");
        console.log(assigneddata);
        console.log("====================================");
        setAssignedResponders(assigneddata);
        setUnassignedResponders(unassigneddata);
        setResponders(responderdata);
      } catch (error) {
        console.error(error);
      }
    };
    fetchAccounts();

    const fetchVerificationRequest = async () => {
      try {
        const data = await request("/team/", "GET");

        setVerificationRequest(data);
        console.log("===========tean=========================");
        console.log(data);
        console.log("====================================");
      } catch (error) {
        console.error(error);
      }
    };

    if (shouldFetchData) {
      fetchVerificationRequest();
    }
  }, [shouldFetchData]);

  useEffect(() => {
    if (activeCategory === "all") {
      console.log("Filtering all requests");
      setFilteredVerificationRequest(
        verificationRequest.filter((request) =>
          request.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [activeCategory, searchQuery, verificationRequest]);

  useEffect(() => {
    const fetchVerificationRequestDetails = async () => {
      try {
        const options = { Authorization: `Bearer ${token}` };
        const data = await request(`/team/${id}`, "GET", options);

        if (data.message !== "not found") {
          console.log("------aaaaaaaaaaaaaaaaaaaaaaaaaaaaadata");
          console.log(data.members);
          setVerificationRequestDetails(data);
          setMember(data.members);
          setHead(data.head._id);
          setName(data.name);
          setTeamId(data._id);
        } else {
          navigate(`/manage/team`);
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (id) {
      fetchVerificationRequestDetails();
      setisModalShown(true);
    } else {
      if (type) {
        setisModalShown(true);
      } else {
        setisModalShown(false);
      }
    }
  }, [id, token, isModalShown]);

  const handleReject = async (e) => {
    e.preventDefault();

    try {
      const options = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      const data = await request(
        `/auth/verification-request/${id}`,
        "PUT",
        options,
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
      const options = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      const data = await request(
        `/auth/verification-request/${id}`,
        "PUT",
        options,
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
  const handleDelete = async () => {
    try {
      const options = { Authorization: `Bearer ${token}` };
      const data = await request(`/team/delete/${id}`, "DELETE", options);
      const { message, success } = data;
      if (success) {
        toast.success(message);
        navigate(`/manage/team`);
        setShouldFetchData(true);
      } else {
        toast.error(message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitName = async (e) => {
    e.preventDefault();

    try {
      const options = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const data = await request("/team/add", "POST", options, {
        name,
      });
      console.log(data);
      const { success, message } = data;
      if (success) {
        toast.success(message);

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
  const handleSaveTeam = async (e) => {
    e.preventDefault();

    try {
      const options = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const data = await request(`/team/update/${id}`, "PUT", options, {
        head,
        members: member,
      });

      console.log(data);
      const { success, message } = data;
      if (success) {
        toast.success(message);

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
  const columns = [
    {
      name: "Name",
      selector: (row) =>
        `${row.firstname} ${row.middlename
          .split(" ")
          .map((name) => name.charAt(0))
          .join("")} ${row.lastname}`,
    },
    {
      name: "Email",
      selector: (row) => row.email,
      sortable: true,
    },
    {
      name: "Team",
      selector: (row) => (row.teamId ? row.teamId.name : "Unassigned"),
      sortable: true,
    },

    /*  {
      name: "Actions",
      cell: (row) => (
        <>
          <div>
            <Link to={`/manage/account/staff/update/${row._id}`}>
              <AiFillEdit />
            </Link>

            <></>
          </div>
        </>
      ),
    }, */
  ];
  return (
    <>
      <Navbar />
      <Link to={"/manage/team/responder"}>Manage Responder</Link>
      <div>
        {filteredVerificationRequest.length > 0 ? (
          <div>
            {filteredVerificationRequest.map((safetyTip) => (
              <div key={safetyTip._id}>
                <Link to={`/manage/team/${safetyTip._id}`}>
                  <h4>{`${safetyTip.name}`}</h4>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <h3>No Team</h3>
        )}
        <form onSubmit={handleSubmitName}>
          <input
            type="text"
            placeholder="team name"
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit">Submit Name</button>
        </form>
      </div>
      <br></br>
      <br></br>
      {isModalShown &&
        (type === "details" ? (
          <>
            <Link to={`/manage/team/update/${id}`}>Go Back</Link>
            <div>
              <AiFillDelete onClick={handleDelete} />
            </div>
            <div>Response{verificationRequestDetails.response}</div>
            <div>{verificationRequestDetails.name}</div>

            {/*  */}

            <div>
              {/*  {verificationRequestDetails.head ? (
                verificationRequestDetails.head.firstname
              ) : ( */}
              <>
                <select value={head} onChange={(e) => setHead(e.target.value)}>
                  {verificationRequestDetails.head ? (
                    <>
                      {/*          {setHead(verificationRequestDetails.head.firstname)} */}
                      <option value={verificationRequestDetails.head._id}>
                        {verificationRequestDetails.head.firstname}
                      </option>
                    </>
                  ) : (
                    <option value="" hidden>
                      Select a head
                    </option>
                  )}
                  {unassignedResponders.map((responder, index) => (
                    <option key={index} value={responder._id}>
                      {`${responder.firstname} ${responder.lastname}`}
                    </option>
                  ))}
                </select>
              </>
              {/*    )} */}
            </div>
            <div>
              <span>Select members</span>

              {verificationRequestDetails.members &&
                verificationRequestDetails.members.map((responder) => (
                  <label key={responder._id}>
                    <input
                      type="checkbox"
                      value={responder._id}
                      checked="true"
                      onChange={(e) => {
                        const selectedMember = e.target.value;
                        const isChecked = e.target.checked;

                        if (isChecked) {
                          setMember((prevMembers) => [
                            ...prevMembers,
                            selectedMember,
                          ]);
                        } else {
                          setMember((prevMembers) =>
                            prevMembers.filter((m) => m !== selectedMember)
                          );
                        }
                      }}
                    />
                    {`${responder.firstname} ${responder.lastname}`}
                  </label>
                ))}

              {unassignedResponders
                .filter((responder) => responder._id !== head)
                .map((responder) => (
                  <label key={responder._id}>
                    <input
                      type="checkbox"
                      value={responder._id}
                      onChange={(e) => {
                        const selectedMember = e.target.value;
                        const isChecked = e.target.checked;

                        if (isChecked) {
                          setMember((prevMembers) => [
                            ...prevMembers,
                            selectedMember,
                          ]);
                        } else {
                          setMember((prevMembers) =>
                            prevMembers.filter((m) => m !== selectedMember)
                          );
                        }
                      }}
                    />
                    {`${responder.firstname} ${responder.lastname}`}
                  </label>
                ))}
            </div>

            {/*  */}
            <button onClick={handleSaveTeam}>Save</button>
            <br></br>
            <div>responder list</div>
          </>
        ) : (
          <div>
            <div>
              <input
                type="text"
                placeholder="Search safetyTips"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div></div>
            <DataTable
              columns={columns}
              data={responders}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 20, 30]}
            />
          </div>
        ))}
      {console.log(type)}
    </>
  );
};

export default ManageTeam;
