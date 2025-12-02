import { useState } from "react";
import "./userlogin.css";
import { FaLink, FaFacebookF, FaLinkedinIn, FaTwitter } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import AskButton from "../../components/AskButton";
import Back from "../../components/Back";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

const Userlogin = () => {
  const [isActive, setIsActive] = useState(false);

  // ---------- Sign in state ----------
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // ---------- Sign up state ----------
  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupDepartment, setSignupDepartment] = useState("");
  const [signupSemester, setSignupSemester] = useState("");
  const [signupCnic, setSignupCnic] = useState("");
  const [signupContact, setSignupContact] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupStudentId, setSignupStudentId] = useState("");

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [studentCardImage, setStudentCardImage] = useState<File | null>(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Small helper to safely store auth data
  const saveAuthToStorage = (token: string, user: any) => {
    try {
      localStorage.setItem("token", token);
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));
    } catch (err) {
      console.error("Error saving auth to localStorage:", err);
    }
  };

  // ---------- LOGIN ----------
  const handleLogin = async () => {
    setMessage("");

    const email = loginEmail.trim();
    const password = loginPassword.trim();

    if (!email || !password) {
      setMessage("⚠️ Please enter email and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "❌ Login failed. Please check your details.");
        return;
      }

      setMessage(data.message || "✅ Login successful");

      // Save auth
      if (data.token && data.user) {
        saveAuthToStorage(data.token, data.user);
      }

      // Route by role
      const role = data.user?.role;

      if (role === "ADMIN") {
        navigate("/dashboard");
      } else if (role === "SUB_ADMIN") {
        navigate("/sub-admin-dashboard");
      } else if (role === "STUDENT") {
        navigate("/student-dashboard");
      } else if (role === "STUDENT_ORGANIZER") {
        navigate("/student-organizer-dashboard");
      } else if (role === "SOCIETY_HEAD") {
        navigate("/society-head-dashboard");
      } else if (role === "SOCIAL_MEDIA") {
        navigate("/social-media-dashboard");
      } else if (role === "CONSULTANT") {
        navigate("/consultant-dashboard");
      } else {
        // fallback
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Error connecting to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- SIGNUP ----------
  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setMessage("");

    const firstName = signupFirstName.trim();
    const lastName = signupLastName.trim();
    const email = signupEmail.trim();
    const department = signupDepartment.trim();
    const semester = signupSemester.trim();
    const cnic = signupCnic.trim();
    const contact = signupContact.trim();
    const password = signupPassword.trim();
    const studentId = signupStudentId.trim();

    if (
      !firstName ||
      !lastName ||
      !email ||
      !department ||
      !semester ||
      !cnic ||
      !contact ||
      !password ||
      !studentId
    ) {
      setMessage("⚠️ Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("full_name", `${firstName} ${lastName}`.trim());
      formData.append("email", email);
      formData.append("password", password);
      formData.append("department", department);
      formData.append("semester", semester);
      formData.append("cnic", cnic);
      formData.append("contact", contact);
      formData.append("student_id", studentId);

      if (profileImage) {
        formData.append("profile_image", profileImage);
      }
      if (studentCardImage) {
        formData.append("student_card_image", studentCardImage);
      }

      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "❌ Registration failed.");
        return;
      }

      setMessage(
        data.message ||
          "✅ Registration successful. Your account will be approved by the organizer."
      );

      // After successful signup, go back to Sign In panel
      setIsActive(false);
    } catch (err) {
      console.error(err);
      setMessage("❌ Error connecting to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- FORGOT PASSWORD ----------
  const handleForgotPassword = async () => {
    const email = loginEmail.trim();

    if (!email) {
      setMessage("⚠️ Enter your email above, then click 'Forgot password?'.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setMessage(
        data.message ||
          "If this email is registered, you'll receive reset instructions (feature coming soon)."
      );
    } catch (err) {
      console.error(err);
      setMessage("❌ Could not request password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`container-admin ${isActive ? "active" : ""}`}>
      <AskButton />
      <Back />

      {/* SIGN IN */}
      <div className="form-container sign-in">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <h2>Sign In</h2>
          <div className="social-icons">
            <a href="#">
              <FaLink className="auth-icon" />
            </a>
            <a href="#">
              <FaFacebookF className="auth-icon" />
            </a>
            <a href="#">
              <FaLinkedinIn className="auth-icon" />
            </a>
            <a href="#">
              <FaTwitter className="auth-icon" />
            </a>
          </div>
          <span>use your credentials to login</span>
          <input
            type="email"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
          />

          <div className="forgot-password-row">
            <button
              type="button"
              className="forgot-password-link"
              onClick={handleForgotPassword}
            >
              Forgot password?
            </button>
          </div>

          <button className="button-admin" type="submit" disabled={loading}>
            {loading ? "Please wait..." : "Sign In"}
          </button>

          {/* Global message (login + signup) */}
          {message && (
            <p style={{ marginTop: "10px", color: "#ccc" }}>{message}</p>
          )}
        </form>
      </div>

      {/* SIGN UP */}
      <div className="form-container sign-up">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister(e);
          }}
        >
          <h2>Create Account</h2>
          <div className="social-icons">
            <a href="#">
              <FaLink className="auth-icon" />
            </a>
            <a href="#">
              <FaFacebookF className="auth-icon" />
            </a>
            <a href="#">
              <FaLinkedinIn className="auth-icon" />
            </a>
            <a href="#">
              <FaTwitter className="auth-icon" />
            </a>
          </div>
          <span>use your personal details for registration</span>

          <div className="signup-fields">
            <div className="input-row">
              <input
                type="text"
                placeholder="First Name"
                value={signupFirstName}
                onChange={(e) => setSignupFirstName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Last Name"
                value={signupLastName}
                onChange={(e) => setSignupLastName(e.target.value)}
              />
            </div>

            <input
              type="email"
              placeholder="Gmail"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
            />

            <div className="input-row">
              <input
                type="text"
                placeholder="Department"
                value={signupDepartment}
                onChange={(e) => setSignupDepartment(e.target.value)}
              />
              <input
                type="text"
                placeholder="Semester (e.g. 5th)"
                value={signupSemester}
                onChange={(e) => setSignupSemester(e.target.value)}
              />
            </div>

            <div className="input-row">
              <input
                type="text"
                placeholder="Student ID"
                value={signupStudentId}
                onChange={(e) => setSignupStudentId(e.target.value)}
              />
            </div>

            <div className="input-row">
              <input
                type="text"
                placeholder="CNIC"
                value={signupCnic}
                onChange={(e) => setSignupCnic(e.target.value)}
              />
              <input
                type="text"
                placeholder="Contact Info"
                value={signupContact}
                onChange={(e) => setSignupContact(e.target.value)}
              />
            </div>

            <input
              type="password"
              placeholder="Password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
            />

            <div className="input-row file-row">
              <label className="file-label">
                <span>Profile Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setProfileImage(
                      e.target.files && e.target.files[0]
                        ? e.target.files[0]
                        : null
                    )
                  }
                />
              </label>

              <label className="file-label">
                <span>Student Card</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setStudentCardImage(
                      e.target.files && e.target.files[0]
                        ? e.target.files[0]
                        : null
                    )
                  }
                />
              </label>
            </div>
          </div>

          <button className="button-admin" type="submit" disabled={loading}>
            {loading ? "Please wait..." : "Sign Up"}
          </button>

          {/* Show same message here as well (errors/success) */}
          {message && (
            <p style={{ marginTop: "10px", color: "#ccc" }}>{message}</p>
          )}
        </form>
      </div>

      <div className="toggle-container">
        <div className="toggle">
          <div className="toggle-panel toggle-left">
            <h1>Hello Sir!</h1>
            <p>
              Enter your personal details to register or sign in to use all the
              features of the system
            </p>
            <button
              className="button-admin hidden"
              onClick={() => setIsActive(false)}
              type="button"
            >
              Sign In
            </button>
          </div>
          <div className="toggle-panel toggle-right">
            <h1>Welcome Back!</h1>
            <p>
              Sign up with your personal details or sign in to use all the
              features of the system
            </p>
            <button
              className="button-admin hidden"
              onClick={() => setIsActive(true)}
              type="button"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Userlogin;
