// src/components/admin/AdminLogoutButton.tsx
import type { FC } from "react";
import { useNavigate } from "react-router-dom";

type AdminLogoutButtonProps = {
  onClick?: () => void;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";


const AdminLogoutButton: FC<AdminLogoutButtonProps> = ({ onClick }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      if (token) {
        await fetch(`${API_BASE}/api/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Error calling /api/logout:", err);
    } finally {
      // Clear local auth on frontend
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");

      // Optional callback (for extra side-effects if needed)
      if (onClick) {
        try {
          onClick();
        } catch (e) {
          console.error("Error in onClick logout callback:", e);
        }
      }

      // Go to login
      navigate("/userlogin");
    }
  };

  return (
    <button
      type="button"
      className="admin-logout-button admin-logout-btn"
      onClick={handleLogout}
    >
      Logout
    </button>
  );
};

export default AdminLogoutButton;
