// src/pages/dashboards/SocietyHeadDashboard.tsx
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
import EventFormCard, {
  EventFormData,
} from "../../components/admin/EventFormCard";
import SocietyInfoManagerCard, {
  SocietyInfo,
} from "../../components/admin/SocietyInfoManagerCard";

type AdminInfo = {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  semester: string;
  cnic: string;
  contact: string;
};

const SocietyHeadDashboard: FC = () => {
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

  const headInfo: AdminInfo = {
    firstName: "Society",
    lastName: "Head",
    email: "society.head@example.com",
    department: "Department / Society",
    semester: "-",
    cnic: "-",
    contact: "-",
  };

  const defaultSociety: SocietyInfo = {
    societyName: "My Society",
    headName: "Society Head",
    facultyAdvisor: "Faculty Advisor",
    contactEmail: "society@example.com",
    contactNumber: "0300-0000000",
    instagram: "",
    facebook: "",
    whatsapp: "",
    membersCount: "0",
    eventsCount: "0",
    status: "Active",
  };

  const handleLogout = () => {
    console.log("Society head logout clicked");
  };

  const handleCreateEvent = (data: EventFormData) => {
    console.log("Society head created event:", data);
    // later: send to backend
  };

  const handleSaveSociety = (data: SocietyInfo) => {
    console.log("Society head saved society info:", data);
    // later: send to backend
  };

  return (
    <div className="admin-dashboard-page">
      <Topbar />
      <Back />
      <BackToTop />
      <AskButton />

      <AdminLogoutButton onClick={handleLogout} />

      <header className="admin-header" data-aos="fade-up">
        <h1>Society Head Dashboard</h1>
        <p>Manage your society profile and publish events.</p>
      </header>

      {/* Info card */}
      <AdminProfileCard adminInfo={headInfo} />

      {/* Event creation – specific to that society */}
      <EventFormCard
        title="Create Society Event"
        helperText="Publish events organized by your society."
        submitLabel="Publish Event"
        onSubmit={handleCreateEvent}
      />

      {/* Society info manager */}
      <SocietyInfoManagerCard
        title="Manage Your Society"
        helperText="Update your society details and contact information."
        initialData={defaultSociety}
        saveLabel="Save Society Info"
        onSave={handleSaveSociety}
      />

      <SocialIcons />
    </div>
  );
};

export default SocietyHeadDashboard;
