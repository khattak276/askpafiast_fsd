// src/pages/dashboards/SocialMediaDashboard.tsx
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
import AppContentControlCard from "../../components/admin/AppContentControlCard";

type AdminInfo = {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  semester: string;
  cnic: string;
  contact: string;
};

const SocialMediaDashboard: FC = () => {
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

  const smInfo: AdminInfo = {
    firstName: "Social Media",
    lastName: "Manager",
    email: "socialmedia@example.com",
    department: "Media / Marketing",
    semester: "-",
    cnic: "-",
    contact: "-",
  };

  const handleLogout = () => {
    console.log("Social media manager logout clicked");
  };

  const handleSaveContent = (payload: any) => {
    console.log("Social media updated app content:", payload);
    // TODO: send to backend / CMS
  };

  return (
    <div className="admin-dashboard-page">
      <Topbar />
      <Back />
      <BackToTop />
      <AskButton />

      <AdminLogoutButton onClick={handleLogout} />

      <header className="admin-header" data-aos="fade-up">
        <h1>Social Media Dashboard</h1>
        <p>Control homepage banners, highlights and visual content.</p>
      </header>

      {/* Info card */}
      <AdminProfileCard adminInfo={smInfo} />

      {/* Content control – role must match the union in AppContentControlCardProps */}
      <AppContentControlCard
        role="socialMediaManager"
        onSaveChanges={handleSaveContent}
      />

      <SocialIcons />
    </div>
  );
};

export default SocialMediaDashboard;
