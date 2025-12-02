// src/components/Topbar.tsx
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
  faUser, // 👤 dashboard icon
} from '@fortawesome/free-solid-svg-icons';

const Topbar: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.toLowerCase();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthToast, setShowAuthToast] = useState(false);
  const [toastTimerId, setToastTimerId] = useState<number | null>(null);

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

  const getActivePath = () => {
    // 🔹 All dashboard routes should highlight the dashboard icon
    const dashboardPaths = [
      '/dashboard',
      '/sub-admin-dashboard',
      '/student-dashboard',
      '/student-organizer-dashboard',
      '/society-head-dashboard',
      '/social-media-dashboard',
      '/consultant-dashboard',
    ];

    if (dashboardPaths.includes(path)) {
      return '/dashboard';
    }

    if (
      path === '/' ||
      path === '/about' ||
      path === '/academic-info' ||
      path === '/rules' ||
      path === '/explore-more' ||
      path === '/lms-portal' ||
      path === '/contactus'
    ) {
      return '/';
    }

    if (path === '/askbot') return '/AskBot';
    if (path === '/navigation') return '/navigation';
    if (path === '/userlogin') return '/userlogin';
    if (path === '/upcomingevents') return '/UpcomingEvents';
    if (path === '/settings') return '/settings';

    return '';
  };

  const activePath = getActivePath();

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

  const handleDashboardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    if (isAuthenticated) {
      goToRoleDashboard();
      return;
    }

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
    { key: 'ask', to: '/AskBot', label: 'Ask', icon: faCommentDots },
    { key: 'nav', to: '/navigation', label: 'Navigation', icon: faLocationDot },

    // 🔹 Dashboard – special behavior + active when on any dashboard route
    
    { key: 'login', to: '/userlogin', label: 'User Login', icon: faLock },
    {
      key: 'events',
      to: '/UpcomingEvents',
      label: 'Upcoming Events',
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
      <div className="topbar">
        <ul>
          {links.map(({ key, to, icon, isDashboard }) => (
            <li key={key} className={activePath === to ? 'active' : ''}>
              <Link
                to={to}
                className="topbar-link"
                onClick={isDashboard ? handleDashboardClick : undefined}
              >
                <div className="topbar-icon-wrapper">
                  <FontAwesomeIcon icon={icon} className="topbar-icon" />

                  {/* 🔒 Grey translucent lock overlay when NOT logged in */}
                  {!isAuthenticated && isDashboard && (
                    <span className="dashboard-lock-badge">
                      <FontAwesomeIcon icon={faLock} />
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {showAuthToast && (
        <div className="auth-toast">
          <p>To enjoy all the features, login or sign up to the system.</p>
        </div>
      )}
    </>
  );
};

export default Topbar;
