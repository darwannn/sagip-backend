import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../redux/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { request } from "../utils/axios";
import moment from "moment";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [notification, setNotification] = useState("");
  const [isModalShown, setisModalShown] = useState(false); // Update initial state

  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchSafetyTipDetails = async () => {
      try {
        const data = await request(`/notification/`, "GET", {
          Authorization: `Bearer ${token}`,
        });
        setNotification(data.notifications);
        console.log(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchSafetyTipDetails();
  }, [isModalShown]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const readnotification = async (e) => {
    e.preventDefault();
    isModalShown ? setisModalShown(false) : setisModalShown(true);
    try {
      const data = await request("/notification/read", "PUT", {
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      console.error(error);
    }
  };
  const handleDelete = async (notificationId) => {
    try {
      console.log(notificationId);
      const data = await request(
        "/notification/delete",
        "PUT",
        {
          Authorization: `Bearer ${token}`,
        },
        {
          notificationId,
        }
      );
      console.log(data);
    } catch (error) {
      console.error(error);
    }
    setNotification((prevState) =>
      prevState.filter((notification) => notification._id !== notificationId)
    );
  };

  return (
    <>
      <div>
        <Link to="/">Home</Link>
      </div>
      <ul></ul>
      <div>
        <span onClick={handleLogout}>Logout</span>
        <br />
        <span onClick={readnotification}>
          notification
          {notification && notification.length > 0
            ? notification.filter(
                (notification) => notification.isRead === false
              ).length
            : 0}
        </span>
        {notification &&
          isModalShown &&
          notification.map((notification, index) => {
            return (
              <div
                key={index}
                style={{ color: notification.isRead ? "black" : "red" }}
              >
                <div>{notification.title}</div>
                <div>{notification.message}</div>
                <div onClick={() => handleDelete(notification._id)}>delete</div>

                {moment(notification.dateSent).format("MMMM DD, YYYY HH:mm A")}
              </div>
            );
          })}
      </div>
    </>
  );
};

export default Navbar;
