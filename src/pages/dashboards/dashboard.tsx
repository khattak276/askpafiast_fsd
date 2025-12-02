import type { FC } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import "./dashboard.css";

// Shared components
import Topbar from "../../components/Topbar";
import Back from "../../components/Back";
import BackToTop from "../../components/BackToTop";
import AskButton from "../../components/AskButton";
import SocialIcons from "../../components/SocialIcons";

// Admin UI
import AdminLogoutButton from "../../components/admin/AdminLogoutButton";
import AdminProfileCard, {
  AdminProfile,
} from "../../components/admin/AdminProfileCard";
import EventFormCard, {
  EventFormData,
} from "../../components/admin/EventFormCard";
import SocietyInfoManagerCard, {
  SocietyInfo,
} from "../../components/admin/SocietyInfoManagerCard";
import UserManagementCard, {
  UserRow,
} from "../../components/admin/UserManagementCard";
import CreateUserCard, {
  NewUserPayload,
} from "../../components/admin/CreateUserCard";
import AppContentControlCard from "../../components/admin/AppContentControlCard";

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
  if (!user.isApproved) {
    status = "Pending";
  } else if (user.isBlocked) {
    status = "Blocked";
  } else {
    status = "Active";
  }

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


const AdminDashboard: FC = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);

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

  // 🔹 Load current admin info from /api/me + protect route
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
          console.error("Failed to load /api/me. HTTP:", res.status);
          return;
        }

        const body = await res.json();
        const u: MeUser | undefined = body.user;

        if (!u) return;

        const nameParts = (u.full_name || "").trim().split(" ");
        const firstName = nameParts[0] || "User";
        const lastName = nameParts.slice(1).join(" ");

        setAdminInfo({
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
        console.error("Error fetching /api/me for AdminDashboard:", err);
      }
    };

    fetchMe();
  }, [navigate]);

  // 🔹 Fetch users from backend once on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token =
          localStorage.getItem("token") || localStorage.getItem("authToken");

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}/api/admin/users`, {
          method: "GET",
          headers,
        });

        if (!response.ok) {
          console.error(
            "Failed to load users for UserManagementCard. HTTP:",
            response.status
          );
          try {
            const body = await response.json();
            console.error("Response body:", body);
          } catch {
            /* ignore */
          }
          return;
        }

        const body = await response.json();
        const apiUsers: ApiUser[] = body.users || [];
        const rows = apiUsers.map(mapApiUserToRow);
        setUsers(rows);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, []);

  // Fallback info if /api/me fails
  const fallbackAdminInfo: AdminInfo = {
    firstName: "Main",
    lastName: "Admin",
    email: "admin@pafiast.com",
    department: "-",
    semester: "-",
    cnic: "-",
    contact: "-",
    studentId: "",
    employeeId: "",
    position: "",
    profileImagePath: "",
    role: "ADMIN",
  };

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

  const handleLogout = () => {
    console.log("Admin logout clicked");
  };

  // 🔹 Create user → backend, then add to table
  const handleCreateUser = async (data: NewUserPayload) => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/admin/users`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMsg = `Failed to create user (HTTP ${response.status})`;
      try {
        const body = await response.json();
        if (body?.error || body?.message || body?.msg) {
          errorMsg = body.error || body.message || body.msg;
        }
      } catch {
        // ignore JSON parse error
      }
      console.error("Create user error:", errorMsg);
      throw new Error(errorMsg);
    }

    const body = await response.json();
    const apiUser = body.user as ApiUser | undefined;
    if (apiUser && apiUser.id != null) {
      const row = mapApiUserToRow(apiUser);
      setUsers((prev) => [row, ...prev]);
    }
  };

  const handleCreateEvent = (data: EventFormData) => {
    console.log("Event created from AdminDashboard:", data);
  };

  const handleSaveSocietyInfo = (data: SocietyInfo) => {
    console.log("Society info saved from AdminDashboard:", data);
  };

  const handleApproveUser = async (id: string) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE}/api/admin/users/${id}/approve`,
        {
          method: "POST",
          headers,
        }
      );

      if (!response.ok) {
        console.error("Failed to approve user", id, "HTTP:", response.status);
        return;
      }

      const body = await response.json();
      const apiUser = body.user as ApiUser | undefined;
      if (!apiUser) return;

      const updatedRow = mapApiUserToRow(apiUser);
      setUsers((prev) =>
        prev.map((u) => (u.id === String(apiUser.id) ? updatedRow : u))
      );
    } catch (err) {
      console.error("Error approving user:", err);
    }
  };

  const handleBlockUser = async (id: string) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE}/api/admin/users/${id}/block`,
        {
          method: "POST",
          headers,
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to block/unblock user",
          id,
          "HTTP:",
          response.status
        );
        return;
      }

      const body = await response.json();
      const apiUser = body.user as ApiUser | undefined;
      if (!apiUser) return;

      const updatedRow = mapApiUserToRow(apiUser);
      setUsers((prev) =>
        prev.map((u) => (u.id === String(apiUser.id) ? updatedRow : u))
      );
    } catch (err) {
      console.error("Error blocking/unblocking user:", err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        console.error("Failed to delete user", id, "HTTP:", response.status);
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const handleSaveAppContent = (payload: any) => {
    console.log("App content updated from AdminDashboard:", payload);
  };

  return (
    <div className="admin-dashboard-page">
      <Topbar />
      <Back />
      <BackToTop />
      <AskButton />

      <AdminLogoutButton onClick={handleLogout} />

      <header className="admin-header" data-aos="fade-up">
        <h1>Admin Dashboard</h1>
        <p>Full control over users, events, societies and content.</p>
      </header>

      {/* 1. Admin’s own info */}
      <AdminProfileCard adminInfo={adminInfo || fallbackAdminInfo} />

      {/* 2. Create new user */}
      <CreateUserCard
        title="Create New User Account"
        helperText="Register students, organizers, society heads, social media managers, consultants, or sub-admins."
        createLabel="Create User"
        onCreateUser={handleCreateUser}
      />

      {/* 3. Event creation */}
      <EventFormCard
        title="Create Event"
        helperText="Publish an official university event to the Upcoming Events section."
        submitLabel="Publish Event"
        onSubmit={handleCreateEvent}
      />

      {/* 4. App-wide content control */}
      <AppContentControlCard role="admin" onSaveChanges={handleSaveAppContent} />

      {/* 5. Society info management */}
      <SocietyInfoManagerCard
        title="Manage Society Info"
        helperText="Update the core details of a society. Admin can manage any society; society heads will only see their own."
        initialData={exampleSociety}
        saveLabel="Save Society Info"
        onSave={handleSaveSocietyInfo}
      />

      {/* 6. User management panel – wired to real DB */}
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

export default AdminDashboard;
