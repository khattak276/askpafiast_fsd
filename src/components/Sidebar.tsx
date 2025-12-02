// src/components/Sidebar.tsx
import { FC, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouseChimney,
  faCommentDots,
  faLocationDot,
  faLock,
  faCalendarDays,
  faSliders,
  faUser,          // 👤 dashboard icon
} from '@fortawesome/free-solid-svg-icons';

const Sidebar: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthToast, setShowAuthToast] = useState(false);
  const [toastTimerId, setToastTimerId] = useState<number | null>(null);

  // --- Helper: check if user is logged in ---
  const refreshAuthState = () => {
    if (typeof window === 'undefined') {
      setIsAuthenticated(false);
      return;
    }
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  };

  useEffect(() => {
    refreshAuthState();
  }, [location.pathname]);

  // --- Active path logic (same as before) ---
  const getEffectivePath = () => {
    const current = location.pathname.toLowerCase();

    if (
      current === '/about' ||
      current === '/academic-info' ||
      current === '/navigation' ||
      current === '/rules' ||
      current === '/contactus' ||
      current === '/userlogin' ||
      current === '/admindashboard'
    ) {
      return '/';
    }

    return current;
  };

  const effectivePath = getEffectivePath();

  // --- Route user to correct dashboard based on role ---
  const goToRoleDashboard = () => {
    if (typeof window === 'undefined') return;

    const userRaw = localStorage.getItem('user');
    let role: string | undefined;

    if (userRaw) {
      try {
        const parsed = JSON.parse(userRaw);
        role = parsed?.role;
      } catch (err) {
        console.error('Failed to parse stored user JSON:', err);
      }
    }

    switch (role) {
      case 'ADMIN':
        navigate('/dashboard');
        break;
      case 'SUB_ADMIN':
        navigate('/sub-admin-dashboard');
        break;
      case 'STUDENT':
        navigate('/student-dashboard');
        break;
      case 'STUDENT_ORGANIZER':
        navigate('/student-organizer-dashboard');
        break;
      case 'SOCIETY_HEAD':
        navigate('/society-head-dashboard');
        break;
      case 'SOCIAL_MEDIA':
        navigate('/social-media-dashboard');
        break;
      case 'CONSULTANT':
        navigate('/consultant-dashboard');
        break;
      default:
        navigate('/userlogin');
        break;
    }
  };

  // --- When dashboard icon is clicked ---
  const handleDashboardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // If logged in → go to respective dashboard
    if (isAuthenticated) {
      goToRoleDashboard();
      return;
    }

    // Not logged in → show message only (no redirect)
    setShowAuthToast(true);

    if (toastTimerId) {
      window.clearTimeout(toastTimerId);
    }

    const id = window.setTimeout(() => {
      setShowAuthToast(false);
    }, 3200);

    setToastTimerId(id);
  };

  const links = [
    { key: 'home', to: '/', label: 'Home', icon: faHouseChimney },
    { key: 'chat', to: '/AskBot', label: 'Chat', icon: faCommentDots },
    { key: 'nav', to: '/navigation', label: 'Navigation', icon: faLocationDot },

    // 🔹 Dashboard entry – special click behavior
  

    { key: 'login', to: '/userlogin', label: 'User Login', icon: faLock },
    {
      key: 'updates',
      to: '/UpcomingEvents',
      label: 'Updates',
      icon: faCalendarDays,
    },
    {
    key: 'dashboard',
    to: '/dashboard',
    label: 'Dashboard',
    icon: faUser,
    isDashboard: true,
  },
    { key: 'settings', to: '/settings', label: 'Settings', icon: faSliders },

  ];

  return (
    <>
      <div className="sidebar">
        <img
          src="/images/logos/LogoCircular-removebg-preview.png"
          alt="PAF-IAST Logo"
          className="sidebar-logo"
        />
        <h2 className="sidebar-title">Ask PAF-IAST</h2>

        <ul>
          {links.map(({ key, to, label, icon, isDashboard }) => {
            const isActive = effectivePath === to;
            const liClasses = [
              isActive ? 'active' : '',
              isDashboard ? 'dashboard-item' : '',
            ]
              .join(' ')
              .trim();

            return (
              <li key={key} className={liClasses}>
                <Link
                  to={to}
                  className="sidebar-link"
                  onClick={
                    isDashboard ? handleDashboardClick : undefined
                  }
                >
                  <div className="sidebar-icon-wrapper">
                    <FontAwesomeIcon icon={icon} className="sidebar-icon" />

                    {/* 🔒 Grey translucent lock overlay when NOT logged in */}
                    {!isAuthenticated && isDashboard && (
                      <span className="dashboard-lock-badge">
                        <FontAwesomeIcon icon={faLock} />
                      </span>
                    )}
                  </div>
                  <span className="sidebar-text">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 🔔 Bottom-center toast message */}
      {showAuthToast && (
        <div className="auth-toast">
          <p>To enjoy all the features, login or sign up to the system.</p>
        </div>
      )}
    </>
  );
};

export default Sidebar;
