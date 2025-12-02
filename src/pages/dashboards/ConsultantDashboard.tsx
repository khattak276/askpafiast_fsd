// src/pages/dashboards/ConsultantDashboard.tsx
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

import AdminLogoutButton from "../../components/admin/AdminLogoutButton";
import AdminProfileCard from "../../components/admin/AdminProfileCard";

type AdminInfo = {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  semester: string;
  cnic: string;
  contact: string;
};

const ConsultantDashboard: FC = () => {
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

  const consultantInfo: AdminInfo = {
    firstName: "Consultant",
    lastName: "User",
    email: "consultant@example.com",
    department: "Advisory / Counseling",
    semester: "-",
    cnic: "-",
    contact: "-",
  };

  const handleLogout = () => {
    console.log("Consultant logout clicked");
  };

  return (
    <div className="admin-dashboard-page">
      <Topbar />
      <Back />
      <BackToTop />
      {/* AskButton is especially important for consultant role */}
      <AskButton />

      <AdminLogoutButton onClick={handleLogout} />

      <header className="admin-header" data-aos="fade-up">
        <h1>Consultant Dashboard</h1>
        <p>
          View your profile. Most of your work will be done via the Ask/Chat
          assistant with students.
        </p>
      </header>

      <AdminProfileCard adminInfo={consultantInfo} />

      <SocialIcons />
    </div>
  );
};

export default ConsultantDashboard;
