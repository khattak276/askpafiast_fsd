// src/components/admin/AdminProfileCard.tsx
import type { FC, FormEvent, ChangeEvent } from "react";
import { useEffect, useState } from "react";
import "../../pages/dashboards/dashboard.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";


export type AdminProfile = {
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  semester?: string;
  cnic?: string;
  contact?: string;
  studentId?: string;
  employeeId?: string;
  position?: string;
  profileImagePath?: string;
  role?: string;
};

type AdminProfileCardProps = {
  adminInfo: AdminProfile;
};

const mapRoleToLabel = (role?: string | null): string => {
  switch ((role || "").toUpperCase()) {
    case "ADMIN":
      return "Admin";
    case "SUB_ADMIN":
      return "Sub-Admin";
    case "STUDENT":
      return "Student";
    case "STUDENT_ORGANIZER":
      return "Student Organizer";
    case "SOCIETY_HEAD":
      return "Society Head";
    case "SOCIAL_MEDIA":
      return "Social Media Manager";
    case "CONSULTANT":
      return "Consultant";
    default:
      return "Panel User";
  }
};

/* ---------- formatting helpers (display only) ---------- */

const formatCnic = (value?: string | null): string => {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits) return "-";
  if (digits.length !== 13) return digits; // show raw if not full length
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

const formatPhone = (value?: string | null): string => {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits) return "-";
  if (digits.length !== 11) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

const AdminProfileCard: FC<AdminProfileCardProps> = ({ adminInfo }) => {
  const [profile, setProfile] = useState<AdminProfile>(adminInfo);
  const [roleLabel, setRoleLabel] = useState<string>("Panel User");

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  // keep local state in sync if parent adminInfo changes
  useEffect(() => {
    setProfile(adminInfo);
  }, [adminInfo]);

  // fetch latest user info from /api/me so card always uses DB data
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!t) return;

    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me`, {
          headers: {
            Authorization: `Bearer ${t}`,
          },
        });

        if (!res.ok) return;

        const data = await res.json();
        const user = data.user;
        if (!user) return;

        const fullName = (user.full_name || "").trim();
        const [firstName, ...rest] = fullName.split(" ");
        const lastName = rest.join(" ");

        const updated: AdminProfile = {
          firstName: firstName || "",
          lastName: lastName || "",
          email: user.email || "",
          department: user.department || "",
          semester: user.semester || "",
          cnic: user.cnic || "",
          contact: user.contact || "",
          studentId: user.student_id || user.studentId || "",
          employeeId: user.employee_id || user.employeeId || "",
          position: user.position || "",
          profileImagePath:
            user.profile_image_path || user.profileImagePath || "",
          role: user.role || "",
        };

        setProfile(updated);
        setRoleLabel(mapRoleToLabel(user.role));

        try {
          localStorage.setItem("user", JSON.stringify(user));
        } catch {
          /* ignore */
        }
      } catch (err) {
        console.error("Error fetching /api/me:", err);
      }
    };

    void fetchMe();
  }, []);

  // Use role + image from localStorage user if available
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem("user");
      if (!raw) {
        setRoleLabel(mapRoleToLabel(adminInfo.role));
        return;
      }

      const user = JSON.parse(raw);
      setRoleLabel(mapRoleToLabel(user.role || adminInfo.role));

      setProfile((prev) => ({
        ...prev,
        role: user.role || prev.role,
        profileImagePath:
          user.profile_image_path ||
          user.profileImagePath ||
          prev.profileImagePath,
      }));
    } catch {
      setRoleLabel(mapRoleToLabel(adminInfo.role));
    }
  }, [adminInfo.role]);

  // auto-hide messages after 5 seconds
  useEffect(() => {
    if (!message && !error) return;
    const t = setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 5000);
    return () => clearTimeout(t);
  }, [message, error]);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || localStorage.getItem("authToken")
      : null;

  const resetMessages = () => {
    setMessage(null);
    setError(null);
  };

  const handleProfileFieldChange =
    (field: keyof AdminProfile) => (e: ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      // numeric-only constraints
      if (field === "cnic" || field === "contact" || field === "semester") {
        value = value.replace(/\D/g, "");
        if (field === "cnic" && value.length > 13) {
          value = value.slice(0, 13);
        }
        if (field === "contact" && value.length > 11) {
          value = value.slice(0, 11);
        }
        if (field === "semester" && value.length > 1) {
          value = value.slice(0, 1);
        }
      }

      setProfile((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleProfileImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setProfileImageFile(file);
  };

  const isStudent = (profile.role || "").toUpperCase() === "STUDENT";

  const avatarSrc =
    profile.profileImagePath &&
    `${API_BASE}/uploads/${profile.profileImagePath}`;

  /* --------------------------------------------
   * SAVE PROFILE (PUT /api/me/profile)
   * ------------------------------------------ */
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!token) {
      setError("You are not logged in.");
      return;
    }

    try {
      setSavingProfile(true);

      const formData = new FormData();
      formData.append("firstName", profile.firstName || "");
      formData.append("lastName", profile.lastName || "");
      formData.append("email", profile.email || "");

      if (profile.department) formData.append("department", profile.department);
      if (profile.semester) formData.append("semester", profile.semester);
      if (profile.cnic) formData.append("cnic", profile.cnic);
      if (profile.contact) formData.append("contact", profile.contact);

      if (isStudent) {
        if (profile.studentId) formData.append("studentId", profile.studentId);
      } else {
        if (profile.employeeId)
          formData.append("employeeId", profile.employeeId);
      }

      if (profile.position) formData.append("position", profile.position);

      if (profileImageFile) {
        formData.append("profile_image", profileImageFile);
      }

      const res = await fetch(`${API_BASE}/api/me/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update profile.");
        return;
      }

      const user = data.user;
      if (user) {
        const fullName = (user.full_name || "").trim();
        const [firstName, ...rest] = fullName.split(" ");
        const lastName = rest.join(" ");

        const updated: AdminProfile = {
          firstName: firstName || "",
          lastName: lastName || "",
          email: user.email || "",
          department: user.department || "",
          semester: user.semester || "",
          cnic: user.cnic || "",
          contact: user.contact || "",
          studentId: user.student_id || user.studentId || "",
          employeeId: user.employee_id || user.employeeId || "",
          position: user.position || "",
          profileImagePath:
            user.profile_image_path || user.profileImagePath || "",
          role: user.role || profile.role,
        };

        setProfile(updated);
        setRoleLabel(mapRoleToLabel(user.role));

        try {
          localStorage.setItem("user", JSON.stringify(user));
        } catch {
          /* ignore */
        }
      }

      setProfileImageFile(null);
      setMessage(data.message || "Profile updated successfully.");
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Profile update error:", err);
      setError("Error updating profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  /* --------------------------------------------
   * CHANGE PASSWORD (POST /api/me/password)
   * ------------------------------------------ */
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!token) {
      setError("You are not logged in.");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill all password fields.");
      return;
    }

    try {
      setSavingPassword(true);

      const payload = {
        currentPassword,
        newPassword,
        confirmPassword,
      };

      const res = await fetch(`${API_BASE}/api/me/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to change password.");
        return;
      }

      setMessage(data.message || "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    } catch (err) {
      console.error("Password change error:", err);
      setError("Error changing password. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  };

  const showStaticInfo = !isEditingProfile && !isChangingPassword;

  return (
    <section className="admin-card-section" data-aos="fade-up">
      <div className="admin-card">
        {/* ===== Top profile area ===== */}
        <div className="dmin-profile admin-profile-header">
          {avatarSrc ? (
            <img className="admin-avatar" src={avatarSrc} alt="Profile" />
          ) : (
            <div className="admin-avatar" />
          )}

          {/* Last name (or first) below picture */}
          <h2 className="admin-name">
            {profile.lastName || profile.firstName || "User"}
          </h2>

          {/* Blue pill with user type */}
          <div className="admin-role-pill admin-role-pill-header">{roleLabel}</div>
        </div>

        {/* ===== Static info grid (view mode) ===== */}
        {showStaticInfo && (
          <>
            <div className="admin-info-grid">
              <div className="admin-field">
                <label>First Name</label>
                <div className="admin-field-box">
                  {profile.firstName || "-"}
                </div>
              </div>

              <div className="admin-field">
                <label>Last Name</label>
                <div className="admin-field-box">
                  {profile.lastName || "-"}
                </div>
              </div>

              <div className="admin-field">
                <label>Department</label>
                <div className="admin-field-box">
                  {profile.department || "-"}
                </div>
              </div>

              <div className="admin-field">
                <label>Semester</label>
                <div className="admin-field-box">
                  {profile.semester || "-"}
                </div>
              </div>

              <div className="admin-field">
                <label>CNIC</label>
                <div className="admin-field-box">
                  {formatCnic(profile.cnic)}
                </div>
              </div>

              <div className="admin-field">
                <label>Contact</label>
                <div className="admin-field-box">
                  {formatPhone(profile.contact)}
                </div>
              </div>

              {/* Only one ID shown based on role */}
              <div className="admin-field">
                <label>{isStudent ? "Student ID" : "Employee ID"}</label>
                <div className="admin-field-box">
                  {isStudent
                    ? profile.studentId || "-"
                    : profile.employeeId || "-"}
                </div>
              </div>

              <div className="admin-field">
                <label>Position / Post</label>
                <div className="admin-field-box">
                  {profile.position || "-"}
                </div>
              </div>

              <div className="admin-field wide">
                <label>Email</label>
                <div className="admin-field-box">{profile.email}</div>
              </div>
            </div>

            <div className="admin-buttons-row">
              <button
                type="button"
                className="admin-btn secondary"
                onClick={() => {
                  resetMessages();
                  setIsEditingProfile(true);
                  setIsChangingPassword(false);
                }}
              >
                Update Info
              </button>
              <button
                type="button"
                className="admin-btn primary"
                onClick={() => {
                  resetMessages();
                  setIsChangingPassword(true);
                  setIsEditingProfile(false);
                }}
              >
                Change Password
              </button>
            </div>
          </>
        )}

        {/* ===== Edit profile mode ===== */}
        {isEditingProfile && (
          <form className="admin-info-grid" onSubmit={handleSaveProfile}>
            <div className="admin-field">
              <label>First Name</label>
              <input
                type="text"
                className="admin-input"
                value={profile.firstName}
                onChange={handleProfileFieldChange("firstName")}
                required
              />
            </div>

            <div className="admin-field">
              <label>Last Name</label>
              <input
                type="text"
                className="admin-input"
                value={profile.lastName}
                onChange={handleProfileFieldChange("lastName")}
                required
              />
            </div>

            <div className="admin-field">
              <label>Department</label>
              <input
                type="text"
                className="admin-input"
                value={profile.department || ""}
                onChange={handleProfileFieldChange("department")}
              />
            </div>

            <div className="admin-field">
              <label>Semester</label>
              <input
                type="text"
                className="admin-input"
                value={profile.semester || ""}
                onChange={handleProfileFieldChange("semester")}
                inputMode="numeric"
                maxLength={1}
              />
            </div>

            <div className="admin-field">
              <label>CNIC (13 digits, no dashes)</label>
              <input
                type="text"
                className="admin-input"
                value={profile.cnic || ""}
                onChange={handleProfileFieldChange("cnic")}
                inputMode="numeric"
                maxLength={13}
              />
            </div>

            <div className="admin-field">
              <label>Contact (11 digits)</label>
              <input
                type="text"
                className="admin-input"
                value={profile.contact || ""}
                onChange={handleProfileFieldChange("contact")}
                inputMode="numeric"
                maxLength={11}
              />
            </div>

            {/* Only one ID input based on role */}
            <div className="admin-field">
              <label>{isStudent ? "Student ID" : "Employee ID"}</label>
              <input
                type="text"
                className="admin-input"
                value={
                  isStudent ? profile.studentId || "" : profile.employeeId || ""
                }
                onChange={
                  isStudent
                    ? handleProfileFieldChange("studentId")
                    : handleProfileFieldChange("employeeId")
                }
              />
            </div>

            <div className="admin-field">
              <label>Position / Post</label>
              <input
                type="text"
                className="admin-input"
                value={profile.position || ""}
                onChange={handleProfileFieldChange("position")}
              />
            </div>

            <div className="admin-field wide">
              <label>Email</label>
              <input
                type="email"
                className="admin-input"
                value={profile.email}
                onChange={handleProfileFieldChange("email")}
                required
              />
            </div>

            <div className="admin-field wide">
              <label>Profile Picture</label>
              <input
                type="file"
                accept="image/*"
                className="admin-input"
                onChange={handleProfileImageChange}
              />
            </div>

            <div className="admin-buttons-row">
              <button
                type="button"
                className="admin-btn secondary"
                onClick={() => {
                  resetMessages();
                  setIsEditingProfile(false);
                  setProfileImageFile(null);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-btn primary"
                disabled={savingProfile}
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* ===== Change password mode ===== */}
        {isChangingPassword && (
          <form className="admin-info-grid" onSubmit={handleChangePassword}>
            <div className="admin-field wide">
              <label>Current Password</label>
              <input
                type="password"
                className="admin-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label>New Password</label>
              <input
                type="password"
                className="admin-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label>Confirm New Password</label>
              <input
                type="password"
                className="admin-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="admin-buttons-row">
              <button
                type="button"
                className="admin-btn secondary"
                onClick={() => {
                  resetMessages();
                  setIsChangingPassword(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-btn primary"
                disabled={savingPassword}
              >
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}

        {/* Messages with gap from the content above */}
        {error && <p className="admin-status-message error">{error}</p>}
        {message && <p className="admin-status-message success">{message}</p>}
      </div>
    </section>
  );
};

export default AdminProfileCard;
