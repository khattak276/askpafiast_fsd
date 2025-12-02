


// src/pages/dashboards/StudentDashboard.tsx
import type { FC } from "react";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import "./dashboard.css";

import Topbar from "../../components/Topbar";
import Back from "../../components/Back";
import BackToTop from "../../components/BackToTop";
import AskButton from "../../components/AskButton";
import SocialIcons from "../../components/SocialIcons";
import AdminProfileCard from "../../components/admin/AdminProfileCard";
import AdminLogoutButton from "../../components/admin/AdminLogoutButton";

type AdminInfo = {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  semester: string;
  cnic: string;
  contact: string;
};

const StudentDashboard: FC = () => {
  useEffect(() => {
    AOS.init({
      duration: 900,
      offset: 40,
      once: true,
      easing: "ease-out-cubic",
    });

    document.body.classList.add("topbar-mode");
    const sidebar = document.querySelector(".sidebar") as HTMLElement | null;
    if (sidebar) sidebar.style.display = "none";

    return () => {
      document.body.classList.remove("topbar-mode");
      if (sidebar) sidebar.style.display = "flex";
    };
  }, []);

  // TODO: later fill this from /api/me
  const studentInfo: AdminInfo = {
    firstName: "Student",
    lastName: "User",
    email: "student@example.com",
    department: "Computer Science",
    semester: "5th",
    cnic: "-",
    contact: "-",
  };

  const handleLogout = () => {
    console.log("Student logout clicked");
  };

  return (
    <div className="admin-dashboard-page">
      <Topbar />
      <Back />
      <BackToTop />
      <AskButton />

      <AdminLogoutButton onClick={handleLogout} />

      <header className="admin-header" data-aos="fade-up">
        <h1>Student Dashboard</h1>
        <p>Your profile and basic academic information.</p>
      </header>

      {/* 🔹 Only info card for students */}
      <AdminProfileCard adminInfo={studentInfo} />

      <SocialIcons />
    </div>
  );
};

export default StudentDashboard;
