// admin / subadmin / student organizer
import type { FC, FormEvent } from "react";
import { useEffect, useState } from "react";
import "../../pages/dashboards/dashboard.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";


/* ────────────────────────────────────────────────────── */
/* Types                                                 */
/* ────────────────────────────────────────────────────── */

export type UserRole =
  | "student"
  | "student-organizer"
  | "society-head"
  | "social-media-manager"
  | "consultant"
  | "sub-admin";

export type NewUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  semester?: string;
  cnic?: string;
  contactNumber?: string;
  studentId?: string;
  employeeId?: string;
  position?: string;
};

type CreateUserCardProps = {
  title?: string;
  helperText?: string;
  createLabel?: string;
  /**
   * Optional custom handler. If not provided, the card will POST directly
   * to `${API_BASE}/api/admin/users`.
   */
  onCreateUser?: (payload: NewUserPayload) => Promise<void> | void;
};

/* ────────────────────────────────────────────────────── */
/* Component                                             */
/* ────────────────────────────────────────────────────── */

const CreateUserCard: FC<CreateUserCardProps> = ({
  title = "Create New User Account",
  helperText = "Register students, organizers, society heads, social media managers, consultants, or sub-admins.",
  createLabel = "Create User",
  onCreateUser,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");

  // auto-hide messages after 5 seconds
  useEffect(() => {
    if (!errorMsg && !successMsg) return;
    const t = setTimeout(() => {
      setErrorMsg(null);
      setSuccessMsg(null);
    }, 5000);
    return () => clearTimeout(t);
  }, [errorMsg, successMsg]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const form = e.currentTarget;

    const roleValue = (form.elements.namedItem("role") as HTMLSelectElement)
      .value as UserRole;

    const department = (form.elements.namedItem(
      "department"
    ) as HTMLInputElement | null)?.value;
    const semesterRaw = (form.elements.namedItem(
      "semester"
    ) as HTMLInputElement | null)?.value;

    const cnicRaw = (form.elements.namedItem("cnic") as HTMLInputElement | null)
      ?.value;
    const contactRaw = (form.elements.namedItem(
      "contactNumber"
    ) as HTMLInputElement | null)?.value;

    const studentId = (form.elements.namedItem(
      "studentId"
    ) as HTMLInputElement | null)?.value;
    const employeeId = (form.elements.namedItem(
      "employeeId"
    ) as HTMLInputElement | null)?.value;
    const position = (form.elements.namedItem(
      "position"
    ) as HTMLInputElement | null)?.value;

    const firstName = (form.elements.namedItem(
      "firstName"
    ) as HTMLInputElement).value.trim();
    const lastName = (form.elements.namedItem(
      "lastName"
    ) as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
      .trim();
    const password = (form.elements.namedItem(
      "password"
    ) as HTMLInputElement).value;

    const isStudentRole = roleValue === "student";

    // ───── Extra validation rules ─────

    if (!firstName || !lastName) {
      setErrorMsg("First name and last name are required.");
      return;
    }

    if (!email || !password) {
      setErrorMsg("Email and password are required.");
      return;
    }

    // Semester: single digit numeric (1–9)
    const semester = semesterRaw?.trim();
    if (isStudentRole) {
      if (!semester) {
        setErrorMsg("Semester is required for students.");
        return;
      }
      if (!/^[1-9]$/.test(semester)) {
        setErrorMsg("Semester must be a single digit number (1–9).");
        return;
      }
    }

    // CNIC: 13 digits (no hyphens in input), format as xxxxx-xxxxxxx-x
    const cleanCnic = (cnicRaw || "").replace(/\D/g, "");
    if (!cleanCnic) {
      setErrorMsg("CNIC is required.");
      return;
    }
    if (cleanCnic.length !== 13) {
      setErrorMsg("CNIC must be exactly 13 digits.");
      return;
    }
    const formattedCnic = `${cleanCnic.slice(0, 5)}-${cleanCnic.slice(
      5,
      12
    )}-${cleanCnic.slice(12)}`;

    // Contact: 11 digits, format as xxxx-xxxxxxx
    const cleanContact = (contactRaw || "").replace(/\D/g, "");
    if (!cleanContact) {
      setErrorMsg("Contact number is required.");
      return;
    }
    if (cleanContact.length !== 11) {
      setErrorMsg("Contact number must be exactly 11 digits.");
      return;
    }
    const formattedContact = `${cleanContact.slice(
      0,
      4
    )}-${cleanContact.slice(4)}`;

    if (isStudentRole && !studentId?.trim()) {
      setErrorMsg("Student ID is required for students.");
      return;
    }

    if (!isStudentRole) {
      if (!employeeId?.trim() || !position?.trim()) {
        setErrorMsg("Employee ID and position are required for staff users.");
        return;
      }
    }

    const payload: NewUserPayload = {
      firstName,
      lastName,
      email,
      password,
      role: roleValue,
      department: department?.trim() || undefined,
      semester: semester || undefined,
      cnic: formattedCnic,
      contactNumber: formattedContact,
      studentId: studentId?.trim() || undefined,
      employeeId: employeeId?.trim() || undefined,
      position: position?.trim() || undefined,
    };

    try {
      setIsSubmitting(true);

      if (onCreateUser) {
        // use custom handler if parent passed one
        await onCreateUser(payload);
      } else {
        // default behaviour – call backend directly
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token") ||
              localStorage.getItem("authToken")
            : null;

        if (!token) {
          throw new Error("You are not logged in.");
        }

        const res = await fetch(`${API_BASE}/api/admin/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to create user.");
        }
      }

      setSuccessMsg("User created successfully ✔");
      form.reset();
      setSelectedRole("");
    } catch (err) {
      console.error("CreateUserCard error:", err);
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Failed to create user. Please try again.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStudentSelected = selectedRole === "student";
  const isStaffSelected = selectedRole !== "" && selectedRole !== "student";

  return (
    <section className="admin-event-section" data-aos="fade-up">
      <div className="admin-event-card">
        <h2 className="admin-section-title">{title}</h2>
        <p className="admin-event-helper">{helperText}</p>

        <form className="admin-event-form" onSubmit={handleSubmit}>
          {/* Name row */}
          <div className="admin-event-row two-col">
            <input
              name="firstName"
              type="text"
              required
              placeholder="First Name"
              className="admin-input"
            />
            <input
              name="lastName"
              type="text"
              required
              placeholder="Last Name"
              className="admin-input"
            />
          </div>

          {/* Email + Password */}
          <div className="admin-event-row two-col">
            <input
              name="email"
              type="email"
              required
              placeholder="Email"
              className="admin-input"
            />
            <input
              name="password"
              type="password"
              required
              placeholder="Temporary Password"
              className="admin-input"
            />
          </div>

          {/* Role */}
          <div className="admin-event-row">
            <select
              name="role"
              required
              className="admin-input"
              onChange={(e) =>
                setSelectedRole(e.target.value as UserRole | "")
              }
            >
              <option value="">Select Role</option>
              <option value="student">Student</option>
              <option value="student-organizer">Student Organizer</option>
              <option value="society-head">Society Head</option>
              <option value="social-media-manager">
                University Social Media Manager
              </option>
              <option value="consultant">Consultant</option>
              <option value="sub-admin">Sub-Admin</option>
            </select>
          </div>

          {/* Student fields: Department + Semester */}
          {isStudentSelected && (
            <div className="admin-event-row two-col">
              <input
                name="department"
                type="text"
                required={isStudentSelected}
                placeholder="Department"
                className="admin-input"
              />
              <input
                name="semester"
                type="number"
                min={1}
                max={9}
                step={1}
                required={isStudentSelected}
                placeholder="Semester (1–9)"
                className="admin-input"
                inputMode="numeric"
              />
            </div>
          )}

          {/* Staff fields: Department + Position */}
          {isStaffSelected && (
            <div className="admin-event-row two-col">
              <input
                name="department"
                type="text"
                required={isStaffSelected}
                placeholder="Department"
                className="admin-input"
              />
              <input
                name="position"
                type="text"
                required={isStaffSelected}
                placeholder="Position / Post"
                className="admin-input"
              />
            </div>
          )}

          {/* CNIC + Contact (common) */}
          <div className="admin-event-row two-col">
            <input
              name="cnic"
              type="text"
              required
              placeholder="CNIC (13 digits, no -)"
              className="admin-input"
              inputMode="numeric"
              minLength={13}
              maxLength={13}
              pattern="\d{13}"
            />
            <input
              name="contactNumber"
              type="text"
              required
              placeholder="Contact Number (11 digits)"
              className="admin-input"
              inputMode="numeric"
              minLength={11}
              maxLength={11}
              pattern="\d{11}"
            />
          </div>

          {/* Student ID or Employee ID */}
          {isStudentSelected && (
            <div className="admin-event-row">
              <input
                name="studentId"
                type="text"
                required={isStudentSelected}
                placeholder="Student ID"
                className="admin-input"
              />
            </div>
          )}

          {isStaffSelected && (
            <div className="admin-event-row">
              <input
                name="employeeId"
                type="text"
                required={isStaffSelected}
                placeholder="Employee ID"
                className="admin-input"
              />
            </div>
          )}

          {/* Status messages with gap from button row */}
          {errorMsg && (
            <p className="admin-status-message error">{errorMsg}</p>
          )}
          {successMsg && (
            <p className="admin-status-message success">{successMsg}</p>
          )}

          <div className="admin-event-actions">
            <button
              type="submit"
              className="admin-btn primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : createLabel}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CreateUserCard;
