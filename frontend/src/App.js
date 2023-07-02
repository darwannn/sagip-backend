import "./App.css";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import jwtDecode from "jwt-decode";
import { logout } from "./redux/authSlice";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import Home from "./pages/Home";
import Error from "./pages/Error";

import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import NewPassword from "./pages/Auth/NewPassword";
import ContactVerification from "./pages/Auth/ContactVerification";

import SafetyTips from "./pages/SafetyTip/SafetyTips";
import SavedSafetyTips from "./pages/SafetyTip/SavedSafetyTips";
import SafetyTipDetails from "./pages/SafetyTip/SafetyTipDetails";

import ManageSafetyTips from "./pages/SafetyTip/ManageSafetyTips";
import SafetyTipInput from "./pages/SafetyTip/SafetyTipInput";

import EmergencyFacility from "./pages/EmergencyFacility/EmergencyFacility";
import ManageEmergencyFacility from "./pages/EmergencyFacility/ManageEmergencyFacility";

import SendAlert from "./pages/SendAlert";
import Test from "./pages/Test";
import Test2 from "./pages/Test2";
import Test3 from "./pages/Test3";

import ManageVerificationRequest from "./pages/Account/ManageVerificationRequest";

import EditPassword from "./pages/Account/EditPassword";
import ManageAccount from "./pages/Account/ManageAccount";
import AccountInput from "./pages/Account/AccountInput";
import VerifyIdentity from "./pages/Account/VerifyIdentity";
import EditPersonalInformation from "./pages/Account/EditPersonalInformation";
import EditContactNumber from "./pages/Account/EditContactNumber";
import PasswordVerification from "./pages/Auth/PasswordVerification";

import ManageTeam from "./pages/Team/ManageTeam";
import TeamInput from "./pages/Team/TeamInput";

import ManageWellnessSurvey from "./pages/WellnessSurvey/ManageWellnessSurvey";
import WellnessSurveyInput from "./pages/WellnessSurvey/WellnessSurveyInput";
import WellnessSurveyReport from "./pages/WellnessSurvey/WellnessSurveyReport";

import Hazard from "./pages/HazardReport/Hazard";
import HazardReport from "./pages/HazardReport/HazardReport";
/* import HazardReportDetails from "./pages/HazardReport/HazardReportDetails"; */
import ManageHazardReport from "./pages/HazardReport/ManageHazardReport";

import Request from "./pages/AssistanceRequest/Request";
import AssistanceRequest from "./pages/AssistanceRequest/AssistanceRequest";
/* import HazardReportDetails from "./pages/HazardReport/HazardReportDetails"; */
import ManageAssistanceRequest from "./pages/AssistanceRequest/ManageAssistanceRequest";

import Map from "./pages/Map";
import ResponderMap from "./pages/ResponderMap";

const App = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  console.log("User:", user);
  console.log("TokenA:", token);

  useEffect(() => {
    checkTokenExpiration();
  }, [token]);

  const checkTokenExpiration = () => {
    if (token) {
      const decodedToken = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);

      console.log(decodedToken);

      if (decodedToken.exp < currentTime) {
        console.log("expired");
        dispatch(logout());
        navigate(`/login`);
      } else {
        console.log("not expired");
      }
    }
  };

  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/login/contact-verification"
          element={<ContactVerification type="login" />}
        />
        <Route path="/register" element={<Register />} />
        <Route
          path="/register/contact-verification"
          element={<ContactVerification type="register" />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/forgot-password/contact-verification"
          element={
            user && user.status !== "unverified" ? (
              <ContactVerification type="forgot-password" />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path="/new-password" element={<NewPassword />} />
        <Route path="/manage/send-alert" element={<SendAlert />} />
        <Route path="/safety-tips" element={<SafetyTips />} />
        <Route path="/manage/safety-tips" element={<ManageSafetyTips />} />
        <Route
          path="/manage/safety-tips/add"
          element={
            user ? <SafetyTipInput type="add" /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/manage/safety-tips/:id"
          element={user ? <SafetyTipDetails /> : <Navigate to="/login" />}
        />
        <Route
          path="/manage/safety-tips/update/:id"
          element={
            user ? <SafetyTipInput type="update" /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/manage/safety-tips/saved"
          element={user ? <SavedSafetyTips /> : <Navigate to="/login" />}
        />
        <Route path="/map" element={<Map />} />
        <Route path="/responder/map" element={<ResponderMap />} />
        {/*  <Route path="/emergency-facility" element={<EmergencyFacility />} /> */}
        <Route
          path="/manage/emergency-facility"
          element={<ManageEmergencyFacility />}
        />
        <Route
          path="/manage/emergency-facility/:id"
          element={<ManageEmergencyFacility />}
        />
        <Route
          path="/manage/emergency-facility/add"
          element={<ManageEmergencyFacility />}
        />
        <Route
          path="/manage/account/resident"
          element={<ManageAccount user="resident" />}
        />
        <Route
          path="/manage/account/verification-request"
          element={<ManageVerificationRequest />}
        />
        <Route
          path="/manage/account/verification-request/:id"
          element={<ManageVerificationRequest />}
        />
        <Route
          path="/manage/account/staff"
          element={<ManageAccount user="staff" />}
        />
        <Route
          path="/manage/account/resident/identity-verification"
          element={<ManageAccount user="resident" />}
        />
        {/*  <Route
          path="/manage/account/resident/add"
          element={
            <AccountInput user="resident" type="add"/>
        }
        /> */}
        <Route
          path="/manage/account/staff/add"
          element={<AccountInput user="staff" type="add" />}
        />
        <Route
          path="/manage/account/resident/update/:id"
          element={<AccountInput user="resident" type="update" />}
        />
        <Route
          path="/manage/account/staff/update/:id"
          element={<AccountInput user="staff" type="update" />}
        />
        <Route path="/verify-identity" element={<VerifyIdentity />} />
        <Route
          path="/profile/personal-information/edit"
          element={<EditPersonalInformation />}
        />
        <Route path="/profile/password/edit" element={<EditPassword />} />
        <Route
          path="/profile/contact-number/edit"
          element={<EditContactNumber />}
        />
        <Route
          path="/profile/contact-number/contact-verification"
          element={<ContactVerification type="contact" />}
        />
        <Route
          path="/profile/password-verification"
          element={<PasswordVerification />}
        />
        <Route path="/manage/team" element={<ManageTeam />} />
        <Route
          path="/manage/team/:id"
          element={<ManageTeam type="details" />}
        />
        <Route
          path="/manage/team/responder"
          element={<ManageTeam type="responder" />}
        />
        <Route
          path="/manage/team/update/:id"
          element={<TeamInput />}
          type="update"
        />

        <Route
          path="/manage/wellness-survey"
          element={<ManageWellnessSurvey />}
        />
        <Route
          path="/manage/wellness-survey/update/:id"
          element={<WellnessSurveyInput type="update" />}
        />
        <Route
          path="/manage/wellness-survey/add"
          element={<WellnessSurveyInput type="add" />}
        />

        {/*    <Route path="/hazard/map" element={<HazardReportDetails />} />
        <Route path="/hazard/map/:id" element={<HazardReportDetails />} /> */}
        <Route path="/hazard" element={<Hazard />} />
        <Route path="/hazard/report" element={<HazardReport />} />
        <Route path="/manage/hazard-report" element={<ManageHazardReport />} />
        <Route
          path="/manage/hazard-report/:id"
          element={<ManageHazardReport />}
        />

        <Route path="/request" element={<Request />} />
        <Route path="/assistance/request" element={<AssistanceRequest />} />
        <Route
          path="/manage/assistance-request"
          element={<ManageAssistanceRequest />}
        />
        <Route
          path="/manage/assistance-request/:id"
          element={<ManageAssistanceRequest />}
        />
        <Route
          path="/manage/wellness-survey/report/:id"
          element={<WellnessSurveyReport />}
        />
        <Route path="/test" element={<Test />} />
        <Route path="/test2" element={<Test2 />} />
        <Route path="/test3" element={<Test3 />} />
        <Route path="/manage/team/add" element={<TeamInput />} type="add" />
        {/* if no route path found*/}
        {location.pathname !== "/" && <Route path="*" element={<Error />} />}
      </Routes>
    </div>
  );
};

export default App;
