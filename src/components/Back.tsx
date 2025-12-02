// src/components/Back.tsx
import { FC } from "react";
import { useNavigate } from "react-router-dom";

const Back: FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    // 🔹 Always go to Home and TELL Home to skip the welcome overlay
    navigate("/", { state: { skipWelcome: true } });
  };

  return (
    <div className="back-button-wrapper-desktop">
      <button className="back-button-top" onClick={handleBack}>
        ← Go Back
      </button>
    </div>
  );
};

export default Back;
