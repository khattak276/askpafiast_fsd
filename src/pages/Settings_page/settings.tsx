import { FC, useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "./Settings.css";
import Topbar from "../../components/Topbar";
import BackToTop from "../../components/BackToTop";
import AskButton from "../../components/AskButton";
import Back from "../../components/Back";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGear,
  faRobot,
  faLanguage,
  faBell,
  faCompass,
  faUser,
  faBrain,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";

const Settings: FC = () => {
  const [activeTab, setActiveTab] = useState("general");

  // ✅ Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"save" | "restore" | null>(null);

  // ✅ Settings states
  const [theme, setTheme] = useState(true); // true = dark, false = light
  const [accent, setAccent] = useState("violet");
  const [motion, setMotion] = useState(true);
  const [tone, setTone] = useState("professional");
  const [autoRedirect, setAutoRedirect] = useState(true);
  const [typing, setTyping] = useState(true);
  const [uiLanguage, setUiLanguage] = useState("English");
  const [chatLanguage, setChatLanguage] = useState("English");
  const [chatMemory, setChatMemory] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [mapView, setMapView] = useState("Satellite");
  const [autoZoom, setAutoZoom] = useState(true);

  useEffect(() => {
    AOS.init({ duration: 800, offset: 30, once: true });
    document.body.classList.add("topbar-mode");
    return () => document.body.classList.remove("topbar-mode");
  }, []);

  // ✅ Modal openers
  const openModal = (type: "save" | "restore") => {
    setModalType(type);
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  // ✅ Save action
  const confirmSave = () => {
    setShowModal(false);
    console.log("✅ Preferences saved successfully!");
  };

  // ✅ Restore Logic
  const confirmRestore = () => {
    switch (activeTab) {
      case "general":
        setTheme(true);
        setAccent("violet");
        setMotion(true);
        break;
      case "assistant":
        setTone("professional");
        setAutoRedirect(true);
        setTyping(true);
        break;
      case "language":
        setUiLanguage("English");
        setChatLanguage("English");
        break;
      case "notifications":
        setChatMemory(true);
        setAnalytics(false);
        break;
      case "navigation":
        setMapView("Satellite");
        setAutoZoom(true);
        break;
      default:
        break;
    }
    setShowModal(false);
    console.log("🔄 Restored defaults for this section!");
  };

  const sections = [
    { id: "general", icon: faGear, label: "General" },
    { id: "assistant", icon: faRobot, label: "Assistant" },
    { id: "language", icon: faLanguage, label: "Language & Region" },
    { id: "notifications", icon: faBell, label: "Notifications & Privacy" },
    { id: "navigation", icon: faCompass, label: "Navigation" },
    { id: "account", icon: faUser, label: "Account" },
    { id: "advanced", icon: faBrain, label: "Advanced" },
  ];

  return (
    <div className="settings-page">
      <Topbar />
      <BackToTop />
      <AskButton />
      <Back />

      <div className="settings-layout" data-aos="fade-up">
        {/* Sidebar */}
        <aside className="settings-sidebar">
          <h2>Settings</h2>
          <ul>
            {sections.map((s) => (
              <li
                key={s.id}
                className={activeTab === s.id ? "active" : ""}
                onClick={() => setActiveTab(s.id)}
              >
                <FontAwesomeIcon icon={s.icon} /> {s.label}
              </li>
            ))}
          </ul>
        </aside>

        {/* Content */}
        <section className="settings-content">
          {/* ==================== GENERAL ==================== */}
          {activeTab === "general" && (
            <div className="settings-card">
              <h3>General Preferences</h3>

              <div className="setting-row">
                <span>Dark Theme</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={theme}
                    onChange={() => setTheme(!theme)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-row">
                <span>Accent Color</span>
                <div className="color-dots">
                  {["violet", "blue", "green", "pink", "gold"].map((color) => (
                    <div
                      key={color}
                      className={`dot ${color} ${
                        accent === color ? "active" : ""
                      }`}
                      onClick={() => setAccent(color)}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="setting-row">
                <span>Motion Effects</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={motion}
                    onChange={() => setMotion(!motion)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <button
                className="reset-btn"
                onClick={() => openModal("restore")}
              >
                <FontAwesomeIcon icon={faRotateLeft} /> Restore Settings
              </button>
            </div>
          )}

          {/* ==================== ASSISTANT ==================== */}
          {activeTab === "assistant" && (
            <div className="settings-card">
              <h3>Assistant Behavior</h3>

              <div className="setting-row">
                <span>Reply Tone</span>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="select"
                >
                  <option>Professional</option>
                  <option>Friendly</option>
                  <option>Motivational</option>
                </select>
              </div>

              <div className="setting-row">
                <span>Auto Redirects</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={autoRedirect}
                    onChange={() => setAutoRedirect(!autoRedirect)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-row">
                <span>Typing Animation</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={typing}
                    onChange={() => setTyping(!typing)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <button
                className="reset-btn"
                onClick={() => openModal("restore")}
              >
                <FontAwesomeIcon icon={faRotateLeft} /> Restore Settings
              </button>
            </div>
          )}

          {/* ==================== LANGUAGE ==================== */}
          {activeTab === "language" && (
            <div className="settings-card">
              <h3>Language & Region</h3>

              <div className="setting-row">
                <span>UI Language</span>
                <select
                  value={uiLanguage}
                  onChange={(e) => setUiLanguage(e.target.value)}
                  className="select"
                >
                  <option>English</option>
                  <option>Urdu</option>
                  <option>Roman Urdu</option>
                  <option>Pashto</option>
                </select>
              </div>

              <div className="setting-row">
                <span>Chat Response Language</span>
                <select
                  value={chatLanguage}
                  onChange={(e) => setChatLanguage(e.target.value)}
                  className="select"
                >
                  <option>English</option>
                  <option>Urdu</option>
                  <option>Roman Urdu</option>
                  <option>Pashto</option>
                </select>
              </div>

              <button
                className="reset-btn"
                onClick={() => openModal("restore")}
              >
                <FontAwesomeIcon icon={faRotateLeft} /> Restore Settings
              </button>
            </div>
          )}

          {/* ==================== NOTIFICATIONS ==================== */}
          {activeTab === "notifications" && (
            <div className="settings-card">
              <h3>Privacy & Notifications</h3>

              <div className="setting-row">
                <span>Save Chat Memory</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={chatMemory}
                    onChange={() => setChatMemory(!chatMemory)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-row">
                <span>Anonymous Analytics</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={() => setAnalytics(!analytics)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <button
                className="reset-btn"
                onClick={() => openModal("restore")}
              >
                <FontAwesomeIcon icon={faRotateLeft} /> Restore Settings
              </button>
            </div>
          )}

          {/* ==================== NAVIGATION ==================== */}
          {activeTab === "navigation" && (
            <div className="settings-card">
              <h3>Navigation Preferences</h3>

              <div className="setting-row">
                <span>Default Map View</span>
                <select
                  value={mapView}
                  onChange={(e) => setMapView(e.target.value)}
                  className="select"
                >
                  <option>Satellite</option>
                  <option>Street</option>
                  <option>Terrain</option>
                </select>
              </div>

              <div className="setting-row">
                <span>Auto Zoom on Location</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={autoZoom}
                    onChange={() => setAutoZoom(!autoZoom)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <button
                className="reset-btn"
                onClick={() => openModal("restore")}
              >
                <FontAwesomeIcon icon={faRotateLeft} /> Restore Settings
              </button>
            </div>
          )}

          {/* ==================== ACCOUNT ==================== */}
          {activeTab === "account" && (
            <div className="settings-card">
              <h3>Account Access</h3>

              <div className="account-buttons">
                <button className="account-btn login">Login</button>
                <button className="account-btn register">Register</button>
                <button className="account-btn logout">Logout</button>
              </div>

              <p className="account-info">
                Manage your login credentials and access permissions here.
              </p>
            </div>
          )}

          {/* ==================== ADVANCED ==================== */}
          {activeTab === "advanced" && (
            <div className="settings-card">
              <h3>System Information</h3>
              <div className="setting-row">
                <span>AI Engine:</span>
                <p>Groq LLaMA 3 (8B)</p>
              </div>
              <div className="setting-row">
                <span>Frontend:</span>
                <p>React + TypeScript</p>
              </div>
              <div className="setting-row">
                <span>Backend:</span>
                <p>Flask (Python)</p>
              </div>
              <p className="system-note">All systems operational ✅</p>
            </div>
          )}

          {/* ==================== SAVE BUTTON ==================== */}
          <div className="save-container">
            <button className="save-btn" onClick={() => openModal("save")}>
              Save All Changes
            </button>
          </div>
        </section>
      </div>

      {/* ==================== MODAL ==================== */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>
              {modalType === "save"
                ? "Confirm Save Changes"
                : "Confirm Restore Settings"}
            </h3>
            <p>
              {modalType === "save"
                ? "Are you sure you want to save all your current settings?"
                : "Are you sure you want to restore defaults for this section?"}
            </p>
            <div className="modal-buttons">
              <button
                className="confirm-btn"
                onClick={modalType === "save" ? confirmSave : confirmRestore}
              >
                Confirm
              </button>
              <button className="cancel-btn" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Settings;
