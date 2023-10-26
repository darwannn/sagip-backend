import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { request } from "../../utils/axios";
import { statusCategory } from "../../utils/categories";
import { toast } from "react-toastify";
import moment from "moment";
import DataTable from "react-data-table-component";
import { AiFillEdit, AiFillDelete } from "react-icons/ai";
import Navbar from "../../components/Navbar";

const Account = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  const [accounts, setAccounts] = useState([]);
  const [filteredResidentAccounts, setFilteredResidentAccounts] = useState([]);
  const [filteredStaffAccounts, setFilteredStaffAccounts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(statusCategory[0]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await request("/account/", "GET", {
          Authorization: `Bearer ${token}`,
        });

        console.log(data);

        setAccounts(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    setFilteredResidentAccounts(handleFilterAccounts(accounts, "resident"));
    setFilteredStaffAccounts(handleFilterAccounts(accounts, "staff"));
  }, [activeCategory, searchQuery, accounts]);

  const handleFilterAccounts = (accounts, userType) => {
    const filteredAccounts = accounts.filter((account) => {
      const categoryMatch =
        activeCategory === statusCategory[0] ||
        account.status.toLowerCase() === activeCategory.toLowerCase();

      const searchMatch =
        account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.contactNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        account.municipality
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        `${account.firstname} ${account.middlename} ${account.lastname}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      if (userType === "staff") {
        return (
          categoryMatch &&
          searchMatch &&
          ["responder", "dispatcher", "employee", "admin"].includes(
            account.userType
          )
        );
      } else if (userType === "resident") {
        return categoryMatch && searchMatch && account.userType === "resident";
      } else {
        return false;
      }
    });

    return filteredAccounts;
  };

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const registeredThisMonth = accounts.filter((account) => {
    const accountDate = new Date(account.createdAt);
    const accountMonth = accountDate.getMonth() + 1;
    const accountYear = accountDate.getFullYear();
    return (
      accountMonth === currentMonth &&
      accountYear === currentYear &&
      account.userType === "resident"
    );
  });

  const handleDeleteBlog = async (id) => {
    try {
      const data = await request(`/account/delete/${id}`, "DELETE", {
        Authorization: `Bearer ${token}`,
      });
      const updatedAccounts = accounts.filter((account) => account._id !== id);
      setAccounts(updatedAccounts);
      const { message } = data;
      toast.success(message);
      if (user === "resident") {
        navigate("/manage/account/resident");
      } else {
        navigate("/manage/account/staff");
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
      name: "Number",
      selector: (row) => row.contactNumber,
      sortable: true,
    },
    {
      name: "Email",
      selector: (row) => row.email,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) =>
        row.status.charAt(0).toUpperCase() + row.status.slice(1),
      sortable: true,
    },
    {
      name: "Address",
      selector: (row) => `${row.street}, ${row.barangay}, ${row.municipality}`,
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <>
          <div>
            <Link
              to={
                user === "resident"
                  ? `/manage/account/resident/update/${row._id}`
                  : `/manage/account/staff/update/${row._id}`
              }
            >
              <AiFillEdit />
            </Link>
            <div>
              <AiFillDelete onClick={() => handleDeleteBlog(row._id)} />
            </div>
            <></>
          </div>
        </>
      ),
    },
  ];

  return (
    <>
      <Navbar />
      <br />
      <br />
      {user === "resident" ? (
        <Link to="/manage/account/verification-request">
          Verification Request
        </Link>
      ) : (
        <Link to="/manage/account/staff/add">Create</Link>
      )}

      {user === "resident" ? (
        <>
          <div
            onClick={() =>
              setFilteredResidentAccounts(
                handleFilterAccounts(accounts, "resident")
              )
            }
          >
            Total:{" "}
            {
              accounts.filter((account) => account.userType === "resident")
                .length
            }
          </div>
          <div onClick={() => setFilteredResidentAccounts(registeredThisMonth)}>
            Registered this month: {registeredThisMonth.length}
          </div>
        </>
      ) : (
        <div>
          Published:{" "}
          {accounts.filter((account) => account.userType !== "resident").length}
        </div>
      )}

      <div>
        <input
          type="text"
          placeholder="Search accounts"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Link to="/manage/account/resident">Resident</Link>
      <Link to="/manage/account/staff">Staff</Link>

      <div>
        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
          style={{ margin: "10px" }}
        >
          {statusCategory.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div>
        <DataTable
          columns={columns}
          data={
            user === "resident"
              ? filteredResidentAccounts
              : filteredStaffAccounts
          }
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 20, 30]}
        />
      </div>
    </>
  );
};

export default Account;
