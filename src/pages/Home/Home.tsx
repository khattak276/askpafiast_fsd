import { FC, useState, useEffect } from "react";
import "./Home.css";
import AskButton from "../../components/AskButton";
import ParticlesBackground from "../../components/ParticlesBackground";
import WelcomeOverlay from "../../components/WelcomeOverlay";
import {
  FaUniversity,
  FaBookOpen,
  FaLaptopCode,
  FaGlobe,
  FaScroll,
  FaUsers,
} from "react-icons/fa";
import { Link } from "react-router-dom";

/** 🔹 Base URL for backend API */
const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5001";

const Home: FC = () => {
  const [apiRunning, setApiRunning] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((res) => {
        if (!res.ok) throw new Error("API down");
        setApiRunning(true);
      })
      .catch(() => setApiRunning(false));
  }, []);

  return (
    <div className="main-content">
      {/* 🔹 Welcome 3D Overlay (only on Home) */}
      <WelcomeOverlay />

      {/* 🔹 Particles only on Home (behind everything) */}
      <ParticlesBackground />

      {!apiRunning && (
        <div className="api-warning">
          Warning: API server is not running. Please start the server to use the
          chatbot.
        </div>
      )}

      <div id="home-container">
        <AskButton />
        <div className="home-card">
          <h2>Ask-pafiast</h2>
          <p>
            This intelligent assistant is designed to help you navigate
            university information and answer your questions.
          </p>

          <div className="feature-grid">
            <a href="/about" className="feature">
              <div className="feature-icon">
                <FaUniversity size={48} />
              </div>
              <h3>About PAF-IAST</h3>
              <p>
                Learn about the vision, mission, and structure of the
                university.
              </p>
            </a>

            <a href="/academic-info" className="feature">
              <div className="feature-icon">
                <FaBookOpen size={48} />
              </div>
              <h3>Academic Info</h3>
              <p>
                Get access to academic policies, course requirements, and more.
              </p>
            </a>

            <Link to="/lms-portal" className="feature">
              <div className="feature-icon">
                <FaLaptopCode size={48} />
              </div>
              <h3>LMS Portal</h3>
              <p>
                Access the Learning Management System to view lectures and
                materials.
              </p>
            </Link>

            <Link to="/explore-more" className="feature">
              <div className="feature-icon">
                <FaGlobe size={48} />
              </div>
              <h3>Explore More</h3>
              <p>
                Discover university facilities, activities, and services in
                detail.
              </p>
            </Link>

            <a href="/rules" className="feature">
              <div className="feature-icon">
                <FaScroll size={48} />
              </div>
              <h3>Rules</h3>
              <p>View academic, hostel, and conduct rules at your fingertips.</p>
            </a>

            <a href="./contactus" className="feature">
              <div className="feature-icon">
                <FaUsers size={48} />
              </div>
              <h3>Contact Us</h3>
              <p>Find out how to reach Ask-pafiast officials.</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
