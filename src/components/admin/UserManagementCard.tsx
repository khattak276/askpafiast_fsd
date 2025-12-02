// db for all the users registered on the panel
// admin / student manager

import type { FC, MouseEvent } from "react";
import { useState } from "react";
import "../../pages/dashboards/dashboard.css";

export type UserRow = {
  id: string; // DB primary key
  name: string;
  role: string; // "Student", "Society Head", etc.
  department: string;
  semester?: string;
  status: string; // "Active", "Pending", "Blocked"
  studentId?: string;
  employeeId?: string;
  // 🔹 NEW: creation date from backend (ISO string)
  createdAt?: string | null;
};

type UserManagementMode = "admin" | "organizer";

type UserManagementCardProps = {
  title?: string;
  helperText?: string;
  users?: UserRow[];
  onApprove?: (id: string) => void;
  onBlock?: (id: string) => void;
  onDelete?: (id: string) => void;
  // admin = full filters, organizer = only students pill + arrange
  mode?: UserManagementMode;
};

type SortField = "name" | "department" | "semester" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

const UserManagementCard: FC<UserManagementCardProps> = ({
  title = "Student & Society Heads Control Panel",
  helperText = "View all registered students and society heads. Approve new signup requests or manage existing users.",
  users,
  onApprove,
  onBlock,
  onDelete,
  mode = "admin",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const data = users && users.length > 0 ? users : [];

  const normalized = searchTerm.trim().toLowerCase();

  // 🔍 SEARCH by name or ID
  const searchedData = normalized
    ? data.filter((user) => {
        const nameMatch = user.name.toLowerCase().includes(normalized);
        const studentMatch = user.studentId
          ? user.studentId.toLowerCase().includes(normalized)
          : false;
        const employeeMatch = user.employeeId
          ? user.employeeId.toLowerCase().includes(normalized)
          : false;
        return nameMatch || studentMatch || employeeMatch;
      })
    : data;

  // 🎯 USER TYPE FILTER
  // values like: "all", "role:Student", "status:Active", ...
  const filteredByUserType = searchedData.filter((user) => {
    if (userTypeFilter === "all" || mode === "organizer") {
      // organizer sees only students anyway (from backend)
      return true;
    }

    if (userTypeFilter.startsWith("role:")) {
      const roleLabel = userTypeFilter.slice(5);
      return user.role === roleLabel;
    }

    if (userTypeFilter.startsWith("status:")) {
      const statusLabel = userTypeFilter.slice(7);
      if (statusLabel === "Deleted") {
        // deleted users don't exist in DB – empty list
        return false;
      }
      return user.status === statusLabel;
    }

    return true;
  });

  // 🧮 SORTING
  const sortedData = [...filteredByUserType].sort((a, b) => {
    const dir = sortDirection === "asc" ? 1 : -1;

    const cmp = (() => {
      switch (sortField) {
        case "name":
          return a.name.localeCompare(b.name);
        case "department":
          return a.department.localeCompare(b.department);
        case "semester": {
          const sa = parseInt(a.semester || "0", 10);
          const sb = parseInt(b.semester || "0", 10);
          return sa - sb;
        }
        case "status":
          return a.status.localeCompare(b.status);
        case "createdAt": {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return ta - tb;
        }
        default:
          return 0;
      }
    })();

    return cmp * dir;
  });

  const handleApprove = (e: MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    if (onApprove) onApprove(id);
    else console.log("Approve clicked for:", id);
  };

  const handleBlock = (e: MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    if (onBlock) onBlock(id);
    else console.log("Block/Unblock clicked for:", id);
  };

  const handleDelete = (e: MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    if (onDelete) onDelete(id);
    else console.log("Delete clicked for:", id);
  };

  const formatDate = (iso?: string | null): string => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <section className="user-mgmt-section" data-aos="fade-up">
      <div className="user-mgmt-card">
        <div className="user-mgmt-header">
          <div>
            <h2 className="admin-section-title">{title}</h2>
            <p className="user-mgmt-helper">{helperText}</p>
          </div>

          {/* 🔧 Filters & arrange controls */}
          <div className="user-mgmt-controls">
            {mode === "admin" ? (
              <>
                {/* User type dropdown */}
                <div className="user-mgmt-select-group">
                  <span className="user-mgmt-select-label">User type</span>
                  <select
                    value={userTypeFilter}
                    onChange={(e) => setUserTypeFilter(e.target.value)}
                  >
                    <option value="all">All users</option>
                    <option value="role:Student">Students</option>
                    <option value="role:Student Organizer">
                      Student Organizers
                    </option>
                    <option value="role:Society Head">Society Heads</option>
                    <option value="role:Social Media Manager">
                      Social Media Managers
                    </option>
                    <option value="role:Consultant">Consultants</option>
                    <option value="role:Sub-Admin">Sub-Admins</option>
                    <option value="role:Admin">Admins</option>
                    <option value="status:Active">Active</option>
                    <option value="status:Blocked">Blocked</option>
                    <option value="status:Pending">Pending</option>
                    
                  </select>
                </div>
              </>
            ) : (
              // Organizer – only students
              <span className="user-mgmt-students-pill">Students</span>
            )}

            {/* Arrange dropdowns (both admin & organizer) */}
            <div className="user-mgmt-select-group">
              <span className="user-mgmt-select-label">Arrange</span>
              <div className="user-mgmt-arrange-row">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                >
                  <option value="name">Name</option>
                  <option value="department">Department</option>
                  <option value="semester">Semester</option>
                  <option value="createdAt">Date of creation</option>
                  <option value="status">Status</option>
                </select>
                <select
                  className="user-mgmt-direction-select"
                  value={sortDirection}
                  onChange={(e) =>
                    setSortDirection(e.target.value as SortDirection)
                  }
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="user-mgmt-search-row">
          <input
            type="text"
            className="admin-input user-mgmt-search-input"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="user-mgmt-table-wrapper">
          <table className="user-mgmt-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>ID</th>
                <th>Department</th>
                <th>Semester</th>
                {/* 🔹 NEW: Created */}
                <th>Created</th>
                <th>Status</th>
                <th className="user-mgmt-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((user) => {
                // 🔹 ID column: Student → studentId, others → employeeId (already how we mapped)
                const idLabel = user.studentId || user.employeeId || "-";

                return (
                  <tr
                    key={user.id}
                    className={`status-${user.status.toLowerCase()}`}
                  >
                    <td>{user.name}</td>
                    <td>{user.role}</td>
                    <td>{idLabel}</td>
                    <td>{user.department}</td>
                    <td>{user.semester || "-"}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <span
                        className={`user-status-pill status-${user.status.toLowerCase()}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div className="user-mgmt-actions">
                        {user.status.toLowerCase() === "pending" && (
                          <button
                            className="user-mgmt-btn approve-btn"
                            onClick={(e) => handleApprove(e, user.id)}
                          >
                            Approve
                          </button>
                        )}
                        <button
                          className="user-mgmt-btn block-btn"
                          onClick={(e) => handleBlock(e, user.id)}
                        >
                          {user.status.toLowerCase() === "blocked"
                            ? "Unblock"
                            : "Block"}
                        </button>
                        <button
                          className="user-mgmt-btn delete-btn"
                          onClick={(e) => handleDelete(e, user.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {sortedData.length === 0 && (
                <tr>
                  <td colSpan={8} className="user-mgmt-empty">
                    No users to display yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default UserManagementCard;
