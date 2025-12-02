// src/pages/dashboards/SubAdminDashboard.tsx
import type { FC } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import "./dashboard.css";

import Topbar from "../../components/Topbar";
import Back from "../../components/Back";
import BackToTop from "../../components/BackToTop";
import AskButton from "../../components/AskButton";
import SocialIcons from "../../components/SocialIcons";

import AdminLogoutButton from "../../components/admin/AdminLogoutButton";
import AdminProfileCard, {
  AdminProfile,
} from "../../components/admin/AdminProfileCard";
import CreateUserCard, {
  NewUserPayload,
} from "../../components/admin/CreateUserCard";
import EventFormCard, {
  EventFormData,
} from "../../components/admin/EventFormCard";
import SocietyInfoManagerCard, {
  SocietyInfo,
} from "../../components/admin/SocietyInfoManagerCard";
import UserManagementCard, {
  UserRow,
} from "../../components/admin/UserManagementCard";
import AppContentControlCard from "../../components/admin/AppContentControlCard";

/* ---------------- Types shared with other dashboards ---------------- */

export type AdminInfo = AdminProfile;

type MeUser = {
  full_name: string;
  email: string;
  department?: string | null;
  semester?: string | null;
  cnic?: string | null;
  contact?: string | null;
  studentId?: string | null;
  employeeId?: string | null;
  position?: string | null;
  profileImagePath?: string | null;
  role?: string;
};

// Shape coming from backend User.to_dict()
type ApiUser = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  isApproved: boolean;
  isBlocked?: boolean;
  department?: string | null;
  semester?: string | null;
  studentId?: string | null;
  employeeId?: string | null;
  createdAt?: string | null;
};

// Helper: map backend user → UserRow for the table
const mapApiUserToRow = (user: ApiUser): UserRow => {
  const roleLabels: Record<string, string> = {
    ADMIN: "Admin",
    SUB_ADMIN: "Sub-Admin",
    STUDENT: "Student",
    STUDENT_ORGANIZER: "Student Organizer",
    SOCIETY_HEAD: "Society Head",
    SOCIAL_MEDIA: "Social Media Manager",
    CONSULTANT: "Consultant",
  };

  const roleLabel = roleLabels[user.role] || user.role;

  let status: string;
  if (!user.isApproved) status = "Pending";
  else if (user.isBlocked) status = "Blocked";
  else status = "Active";

  return {
    id: String(user.id),
    name: user.full_name,
    role: roleLabel,
    department: user.department || "-",
    semester: user.semester || "-",
    status,
    studentId: user.studentId || undefined,
    employeeId: user.employeeId || undefined,
    createdAt: user.createdAt || null,
  };
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";


const SubAdminDashboard: FC = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [subAdminInfo, setSubAdminInfo] = useState<AdminInfo | null>(null);

  /* ---------------- Page setup (AOS + hide sidebar) ---------------- */

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

  /* ---------------- Load current Sub-Admin info from /api/me ---------------- */

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token =
          localStorage.getItem("token") || localStorage.getItem("authToken");

        if (!token) {
          navigate("/userlogin");
          return;
        }

        const res = await fetch(`${API_BASE}/api/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        // Token expired / invalid → kick back to login
        if (res.status === 401 || res.status === 403 || res.status === 422) {
          navigate("/userlogin");
          return;
        }

        if (!res.ok) {
          console.error("Failed to load /api/me for Sub-Admin. HTTP:", res.status);
          return;
        }

        const body = await res.json();
        const u: MeUser | undefined = body.user;
        if (!u) return;

        const nameParts = (u.full_name || "").trim().split(" ");
        const firstName = nameParts[0] || "Sub";
        const lastName = nameParts.slice(1).join(" ");

        setSubAdminInfo({
          firstName,
          lastName,
          email: u.email || "",
          department: u.department || "-",
          semester: u.semester || "-",
          cnic: u.cnic || "-",
          contact: u.contact || "-",
          studentId: (u.studentId as string | null) || "",
          employeeId: (u.employeeId as string | null) || "",
          position: (u.position as string | null) || "",
          profileImagePath: (u.profileImagePath as string | null) || "",
          role: (u.role as string | null) || "",
        });
      } catch (err) {
        console.error("Error fetching /api/me for Sub-Admin:", err);
      }
    };

    fetchMe();
  }, [navigate]);

  /* ---------------- Load all users (Sub-Admin sees full list) ---------------- */

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token =
          localStorage.getItem("token") || localStorage.getItem("authToken");

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/api/admin/users`, {
          method: "GET",
          headers,
        });

        if (!res.ok) {
          console.error(
            "Failed to load users for Sub-Admin. HTTP:",
            res.status
          );
          return;
        }

        const body = await res.json();
        const apiUsers: ApiUser[] = body.users || [];
        setUsers(apiUsers.map(mapApiUserToRow));
      } catch (err) {
        console.error("Error fetching users for Sub-Admin:", err);
      }
    };

    fetchUsers();
  }, []);

  /* ---------------- Fallback info if /api/me fails ---------------- */

  const fallbackSubAdminInfo: AdminInfo = {
    firstName: "Sub",
    lastName: "Admin",
    email: "subadmin@example.com",
    department: "-",
    semester: "-",
    cnic: "-",
    contact: "-",
    studentId: "",
    employeeId: "",
    position: "",
    profileImagePath: "",
    role: "SUB_ADMIN",
  };

  /* ---------------- Example society data (same as before) ---------------- */

  const exampleSociety: SocietyInfo = {
    societyName: "Computer Science Society",
    headName: "John Doe",
    facultyAdvisor: "Dr. Smith",
    contactEmail: "cs-society@pafiast.com",
    contactNumber: "0300-0000000",
    instagram: "",
    facebook: "",
    whatsapp: "",
    membersCount: "40",
    eventsCount: "5",
    status: "Active",
  };

  /* ---------------- Handlers ---------------- */

  const handleLogout = () => {
    console.log("Sub Admin logout clicked");
    // you can optionally clear token + navigate here if you want
  };

  const handleCreateUser = async (data: NewUserPayload) => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/admin/users`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      let msg = `Failed to create user (HTTP ${res.status})`;
      try {
        const body = await res.json();
        if (body?.error || body?.message || body?.msg) {
          msg = body.error || body.message || body.msg;
        }
      } catch {
        /* ignore */
      }
      console.error("Create user error (Sub-Admin):", msg);
      throw new Error(msg);
    }

    const body = await res.json();
    const apiUser = body.user as ApiUser | undefined;
    if (apiUser && apiUser.id != null) {
      setUsers((prev) => [mapApiUserToRow(apiUser), ...prev]);
    }
  };

  const handleCreateEvent = (data: EventFormData) => {
    console.log("Sub Admin created event:", data);
  };

  const handleSaveSocietyInfo = (data: SocietyInfo) => {
    console.log("Sub Admin saved society info:", data);
  };

  const handleApproveUser = async (id: string) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/admin/users/${id}/approve`, {
        method: "POST",
        headers,
      });

      if (!res.ok) {
        console.error("Failed to approve user", id, "HTTP:", res.status);
        return;
      }

      const body = await res.json();
      const apiUser = body.user as ApiUser | undefined;
      if (!apiUser) return;

      const row = mapApiUserToRow(apiUser);
      setUsers((prev) =>
        prev.map((u) => (u.id === String(apiUser.id) ? row : u))
      );
    } catch (err) {
      console.error("Error approving user (Sub-Admin):", err);
    }
  };

  const handleBlockUser = async (id: string) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/admin/users/${id}/block`, {
        method: "POST",
        headers,
      });

      if (!res.ok) {
        console.error(
          "Failed to block/unblock user",
          id,
          "HTTP:",
          res.status
        );
        return;
      }

      const body = await res.json();
      const apiUser = body.user as ApiUser | undefined;
      if (!apiUser) return;

      const row = mapApiUserToRow(apiUser);
      setUsers((prev) =>
        prev.map((u) => (u.id === String(apiUser.id) ? row : u))
      );
    } catch (err) {
      console.error("Error block/unblock (Sub-Admin):", err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        console.error("Failed to delete user", id, "HTTP:", res.status);
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Error deleting user (Sub-Admin):", err);
    }
  };

  const handleSaveAppContent = (payload: any) => {
    console.log("Sub Admin updated app content:", payload);
  };

  /* ---------------- JSX ---------------- */

  return (
    <div className="admin-dashboard-page">
      <Topbar />
      <Back />
      <BackToTop />
      <AskButton />

      <AdminLogoutButton onClick={handleLogout} />

      <header className="admin-header" data-aos="fade-up">
        <h1>Sub-Admin Dashboard</h1>
        <p>Full control over users, events, societies and content.</p>
      </header>

      {/* 🔹 Sub-Admin’s own info card (from DB via /api/me) */}
      <AdminProfileCard adminInfo={subAdminInfo || fallbackSubAdminInfo} />

      <CreateUserCard
        title="Create New User Account"
        helperText="Register students, organizers, society heads, social media managers, consultants, or sub-admins (as allowed)."
        createLabel="Create User"
        onCreateUser={handleCreateUser}
      />

      <EventFormCard
        title="Create Event"
        helperText="Publish an official university event to the Upcoming Events section."
        submitLabel="Publish Event"
        onSubmit={handleCreateEvent}
      />

      {/* Sub admin uses same content-control card as main admin */}
      <AppContentControlCard role="admin" onSaveChanges={handleSaveAppContent} />

      <SocietyInfoManagerCard
        title="Manage Society Info"
        helperText="Update the core details of a society."
        initialData={exampleSociety}
        saveLabel="Save Society Info"
        onSave={handleSaveSocietyInfo}
      />

      <UserManagementCard
        title="Students & Society Heads Panel"
        helperText="Review all registered users. Approve pending signup requests or manage existing accounts."
        users={users}
        mode="admin"
        onApprove={handleApproveUser}
        onBlock={handleBlockUser}
        onDelete={handleDeleteUser}
      />

      <SocialIcons />
    </div>
  );
};

export default SubAdminDashboard;
