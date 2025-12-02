// src/App.tsx
import { FC, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import WelcomeOverlay from "./components/WelcomeOverlay";

import Userlogin from "./pages/User_login/userlogin";
import Home from "./pages/Home/Home";
import About from "./pages/About_us/About";
import AcademicInfo from "./pages/Academic_info/AcademicInfo";
import Dashboard from "./pages/dashboards/dashboard";
import AskBot from "./pages/Ask_bot/AskBot";
import ContactUs from "./pages/Contact_us/contactus";
import Navigation from "./pages/Navigation/Navigation";
import Rules from "./pages/Rules/Rules";
import Settings from "./pages/Settings_page/settings";
import UpcomingEvents from "./pages/Upcomming_events/UpcomingEvents";
import LmsPortal from "./pages/lms_portal/LmsPortal";
import ExploreMore from "./pages/Explore_more/ExploreMore";

// 🔹 Role-based dashboards
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import StudentOrganizerDashboard from "./pages/dashboards/StudentOrganizerDashboard";
import SocietyHeadDashboard from "./pages/dashboards/SocietyHeadDashboard";
import SocialMediaDashboard from "./pages/dashboards/SocialMediaDashboard";
import ConsultantDashboard from "./pages/dashboards/ConsultantDashboard";
import SubAdminDashboard from "./pages/dashboards/SubAdminDashboard";

import "./App.css";
import "./pages/Home/Home.css";

console.log(
  "%cPerformance Tip:",
  "color: #0ff; font-weight: bold;",
  "Avoid unnecessary re-renders and DOM mutations by properly cleaning up effects and CSS class toggles."
);

// 🔒 Small auth guard component
type RequireAuthProps = {
  allowedRoles?: string[];
  children: JSX.Element;
};

const RequireAuth: FC<RequireAuthProps> = ({ allowedRoles, children }) => {
  const location = useLocation();

  // 🔹 Safely read from localStorage only in browser
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || localStorage.getItem("authToken")
      : null;

  const userRaw =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;

  // ✅ Treat as NOT logged in only if we have neither token nor user
  if (!token && !userRaw) {
    return (
      <Navigate
        to="/userlogin"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  let role: string | undefined;
  if (userRaw) {
    try {
      const parsed = JSON.parse(userRaw);
      role = parsed?.role;
    } catch (err) {
      console.error("Failed to parse stored user JSON:", err);
    }
  }

  // If specific roles are required and we have a role, enforce it
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Role mismatch → send home
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppContent: FC = () => {
  const location = useLocation();

  const isTopbarPage =
    location.pathname === "/about" ||
    location.pathname === "/academic-info" ||
    location.pathname === "/rules" ||
    location.pathname === "/navigation" ||
    location.pathname === "/userlogin" ||
    location.pathname === "/dashboard" ||
    location.pathname === "/upcoming-events" ||
    location.pathname === "/contactus" ||
    location.pathname === "/settings" ||
    location.pathname === "/askbot" ||
    location.pathname === "/lms-portal" ||
    location.pathname === "/explore-more" ||
    // 🔹 Dashboards also use Topbar
    location.pathname === "/student-dashboard" ||
    location.pathname === "/sub-admin-dashboard" ||
    location.pathname === "/student-organizer-dashboard" ||
    location.pathname === "/society-head-dashboard" ||
    location.pathname === "/social-media-dashboard" ||
    location.pathname === "/consultant-dashboard";

  useEffect(() => {
    const body = document.body;

    if (isTopbarPage) {
      body.classList.add("topbar-mode");
    } else {
      body.classList.remove("topbar-mode");
    }

    if (location.pathname === "/rules") {
      body.classList.add("hide-particles");
    } else {
      body.classList.remove("hide-particles");
    }

    return () => {
      body.classList.remove("topbar-mode");
      body.classList.remove("hide-particles");
    };
  }, [location.pathname, isTopbarPage]);

  return (
    <div className="app">
      <WelcomeOverlay />

      {isTopbarPage ? <Topbar /> : <Sidebar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/academic-info" element={<AcademicInfo />} />
        <Route path="/navigation" element={<Navigation />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/userlogin" element={<Userlogin />} />
        <Route path="/upcomingevents" element={<UpcomingEvents />} />
        <Route path="/contactus" element={<ContactUs />} />
        <Route path="/askbot" element={<AskBot />} />
        <Route path="/lms-portal" element={<LmsPortal />} />
        <Route path="/explore-more" element={<ExploreMore />} />

        {/* 🔹 Admin dashboard (ADMIN + SUB_ADMIN) */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth allowedRoles={["ADMIN", "SUB_ADMIN"]}>
              <Dashboard />
            </RequireAuth>
          }
        />

        {/* 🔹 Sub-Admin dashboard (ADMIN + SUB_ADMIN) */}
        <Route
          path="/sub-admin-dashboard"
          element={
            <RequireAuth allowedRoles={["ADMIN", "SUB_ADMIN"]}>
              <SubAdminDashboard />
            </RequireAuth>
          }
        />

        {/* 🔹 Student dashboard (STUDENT) */}
        <Route
          path="/student-dashboard"
          element={
            <RequireAuth allowedRoles={["STUDENT"]}>
              <StudentDashboard />
            </RequireAuth>
          }
        />

        {/* 🔹 Student Organizer dashboard */}
        <Route
          path="/student-organizer-dashboard"
          element={
            <RequireAuth allowedRoles={["STUDENT_ORGANIZER"]}>
              <StudentOrganizerDashboard />
            </RequireAuth>
          }
        />

        {/* 🔹 Society Head */}
        <Route
          path="/society-head-dashboard"
          element={
            <RequireAuth allowedRoles={["SOCIETY_HEAD"]}>
              <SocietyHeadDashboard />
            </RequireAuth>
          }
        />

        {/* 🔹 Social Media Manager */}
        <Route
          path="/social-media-dashboard"
          element={
            <RequireAuth allowedRoles={["SOCIAL_MEDIA"]}>
              <SocialMediaDashboard />
            </RequireAuth>
          }
        />

        {/* 🔹 Consultant */}
        <Route
          path="/consultant-dashboard"
          element={
            <RequireAuth allowedRoles={["CONSULTANT"]}>
              <ConsultantDashboard />
            </RequireAuth>
          }
        />
      </Routes>
    </div>
  );
};

const App: FC = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
