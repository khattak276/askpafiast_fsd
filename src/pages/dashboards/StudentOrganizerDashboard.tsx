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
import UserManagementCard, {
  UserRow,
} from "../../components/admin/UserManagementCard";

// ----------------- Types -----------------

type AdminInfo = AdminProfile;

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

// Helper: map backend user → UserRow for table
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


// ----------------- Component -----------------

const StudentOrganizerDashboard: FC = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [organizerInfo, setOrganizerInfo] = useState<AdminInfo | null>(null);

  // Page setup (AOS + hide sidebar)
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

  // 🔹 Load organizer info from /api/me + protect route
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

        if (res.status === 401 || res.status === 403 || res.status === 422) {
          navigate("/userlogin");
          return;
        }

        if (!res.ok) {
          console.error(
            "Failed to load /api/me for Student Organizer. HTTP:",
            res.status
          );
          return;
        }

        const body = await res.json();
        const u: MeUser | undefined = body.user;
        if (!u) return;

        const nameParts = (u.full_name || "").trim().split(" ");
        const firstName = nameParts[0] || "Student";
        const lastName = nameParts.slice(1).join(" ");

        setOrganizerInfo({
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
        console.error("Error fetching /api/me for Student Organizer:", err);
      }
    };

    fetchMe();
  }, [navigate]);

  // Load users from backend once
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
            "Failed to load users for Student Organizer. HTTP:",
            res.status
          );
          return;
        }

        const body = await res.json();
        const apiUsers: ApiUser[] = body.users || [];
        setUsers(apiUsers.map(mapApiUserToRow));
      } catch (err) {
        console.error("Error fetching users for Student Organizer:", err);
      }
    };

    fetchUsers();
  }, []);

  // Fallback organizer info if /api/me fails
  const fallbackOrganizerInfo: AdminInfo = {
    firstName: "Student",
    lastName: "Organizer",
    email: "organizer@example.com",
    department: "Department",
    semester: "Semester",
    cnic: "-",
    contact: "-",
    studentId: "",
    employeeId: "",
    position: "",
    profileImagePath: "",
    role: "STUDENT_ORGANIZER",
  };

  const handleLogout = () => {
    console.log("Student Organizer logout clicked");
  };

  // 🔹 Create user → backend + update table
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
      console.error("Create user error (Organizer):", msg);
      throw new Error(msg);
    }

    const body = await res.json();
    const apiUser = body.user as ApiUser | undefined;
    if (apiUser && apiUser.id != null) {
      setUsers((prev) => [mapApiUserToRow(apiUser), ...prev]);
    }
  };

  // 🔹 Approve user
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
      console.error("Error approving user (Organizer):", err);
    }
  };

  // 🔹 Block / Unblock user
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
      console.error("Error block/unblock (Organizer):", err);
    }
  };

  // 🔹 Delete user
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
      console.error("Error deleting user (Organizer):", err);
    }
  };

  return (
    <div className="admin-dashboard-page">
      <Topbar />
      <Back />
      <BackToTop />
      <AskButton />

      <AdminLogoutButton onClick={handleLogout} />

      <header className="admin-header" data-aos="fade-up">
        <h1>Student Organizer Dashboard</h1>
        <p>Manage students and user accounts assigned to you.</p>
      </header>

      {/* 1. Organizer’s own info card */}
      <AdminProfileCard adminInfo={organizerInfo || fallbackOrganizerInfo} />

      {/* 2. Create new user (Student Organizer → only students) */}
      <CreateUserCard
        title="Create New User"
        helperText="Register new students or society members."
        createLabel="Create User"
        onCreateUser={handleCreateUser}
      />

      {/* 3. User management table – only students + arrange */}
      <UserManagementCard
        title="User Management"
        helperText="Review and manage students created / assigned to you."
        users={users}
        mode="organizer"
        onApprove={handleApproveUser}
        onBlock={handleBlockUser}
        onDelete={handleDeleteUser}
      />

      <SocialIcons />
    </div>
  );
};

export default StudentOrganizerDashboard;
