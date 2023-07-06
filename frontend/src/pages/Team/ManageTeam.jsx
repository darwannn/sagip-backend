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
        const data = await request("/team/responder", "GET", {
          Authorization: `Bearer ${token}`,
        });
        console.log("res");
        console.log(data);
        setAssignedResponders(data.assignedResponders);
        setUnassignedResponders(data.unassignedResponders);
        setResponders(data.responders);
        /*  const unassigneddata = await request(
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
        setResponders(responderdata); */
      } catch (error) {
        console.error(error);
      }
    };
    fetchAccounts();

    const fetchVerificationRequest = async () => {
      try {
        const data = await request("/team/", "GET", {
          Authorization: `Bearer ${token}`,
        });

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
        console.log("====================================");
        console.log(data);
        console.log("====================================");
        if (data.message !== "not found") {
          setVerificationRequestDetails(data);
          setMember(data.members);
          setHead(data.head);
          setName(data.name);

          // Create a new array with the current head and members
          const updatedUnassignedResponders = [...data.members, data.head];

          // Add the new array to the existing unassignedResponders array
          /* setUnassignedResponders((prevUnassignedResponders) => [
            ...prevUnassignedResponders,
            ...updatedUnassignedResponders,
          ]); */
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

  const handleUpdateIndividual = async (e, userId, prevTeamId) => {
    e.preventDefault();
    let newTeamId = e.target.value;
    try {
      const data = await request(
        `/team/update/assignment/`,
        "PUT",
        {
          Authorization: `Bearer ${token}`,
        },
        { newTeamId, userId, prevTeamId }
      );
      const { success, message } = data;
      console.log(data);

      if (success) {
        toast.success(message);
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
  const handleHeadChange = (e) => {
    const selectedHead = e.target.value;

    setHead(selectedHead);

    // Include the current head in the member list
    /*   if (
      verificationRequestDetails.head &&
      !member.includes(verificationRequestDetails.head._id)
    ) {
      setMember([...member, verificationRequestDetails.head._id]);
    } */
  };

  const handleSubmitName = async (e) => {
    e.preventDefault();

    try {
      const data = await request(
        "/team/add",
        "POST",
        {
          Authorization: `Bearer ${token}`,
        },
        {
          name,
        }
      );
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
      const data = await request(
        `/team/update/${id}`,
        "PUT",
        {
          Authorization: `Bearer ${token}`,
        },
        {
          head: "64a6de4164b1389a52aa0205",
          members: ["64a6eaa1b6846bdbfa2a6ca1", "64a6df2b64b1389a52aa020d"],
          /*  head,
          members: member, */
        }
      );

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
      selector: (row) =>
        row.teamName ? (
          //value = newteam
          //row.id == userId
          //prev team name
          <select
            onChange={(e) => handleUpdateIndividual(e, row._id, row.teamId)}
          >
            <option value="unassigned">Unassigned</option>
            {verificationRequest &&
              verificationRequest.map(
                (team, index) =>
                  team && (
                    <option
                      key={index}
                      value={team._id}
                      selected={row.teamName === team.name}
                    >
                      {team.name}
                    </option>
                  )
              )}
          </select>
        ) : (
          <>
            <select onChange={(e) => handleUpdateIndividual(e, row._id, "")}>
              <option value="" hidden>
                Select a team
              </option>

              {verificationRequest &&
                verificationRequest.map(
                  (team, index) =>
                    team && (
                      <option key={index} value={team._id}>
                        {`${team.name}`}
                      </option>
                    )
                )}
            </select>
          </>
        ),
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
              <span>Select head</span>
              <select value={head} onChange={handleHeadChange}>
                {verificationRequestDetails.head ? (
                  <>
                    {}
                    <option value={verificationRequestDetails.head._id}>
                      {verificationRequestDetails.head.firstname}
                    </option>
                  </>
                ) : (
                  <option value="" hidden>
                    Select a head
                  </option>
                )}

                {unassignedResponders &&
                  unassignedResponders.map(
                    (responder, index) =>
                      responder && (
                        <option key={index} value={responder._id}>
                          {`${responder.firstname} ${responder.lastname}`}
                        </option>
                      )
                  )}
              </select>
            </div>
            {/*  <div>
              <span>Select members</span>

              {console.log("as")}
              {console.log(unassignedResponders)}
              {unassignedResponders
                .filter((responder) => responder._id !== head)
                .map(
                  (responder) =>
                    responder && (
                      <label key={responder._id}>
                        <input
                          type="checkbox"
                          value={responder._id}
                          checked={member.some((m) =>
                            m._id.includes(responder._id)
                          )}
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
                        {`${responder.firstname} ${responder._id}`}
                      </label>
                    )
                )}
            </div> */}

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
