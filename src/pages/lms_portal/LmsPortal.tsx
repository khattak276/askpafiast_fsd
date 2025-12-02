// src/pages/lms_portal/LmsPortal.tsx
import type { FC } from 'react';

import Topbar from '../../components/Topbar';
import Back from '../../components/Back';
import BackToTop from '../../components/BackToTop';
import AskButton from '../../components/AskButton';
import SocialIcons from '../../components/SocialIcons';

import './LmsPortal.css';

const LMS_URL =
  'https://lms.paf-iast.edu.pk/StudentAccount/Account/Login?ReturnUrl=%2F';

const LmsPortal: FC = () => {
  const handleOpenLms = () => {
    // Open the official LMS in a NEW TAB and keep Ask-PAF-IAST open
    window.open(LMS_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="lms-page">
        {/* Same helpers as your other topbar pages */}
        <Topbar />
        <Back />
        <BackToTop />
        <AskButton />

        <div className="lms-container">
          <header>
            <h1>PAF-IAST LMS Portal</h1>
          </header>

          <p>
            Access the official{' '}
            <b>PAF-IAST Learning Management System (LMS)</b> to view your
            registered courses, download lecture materials, submit assignments,
            check grades, and receive announcements from your instructors.
          </p>

          <p>
            For the best experience, the LMS will open in a{' '}
            <b>separate browser tab</b>. Your Ask-PAF-IAST assistant will stay
            open in this tab, so you can switch back anytime if you need help
            with rules, academic info, or navigation.
          </p>

          <div className="lms-actions-row">
            <button
              type="button"
              className="lms-open-btn"
              onClick={handleOpenLms}
            >
              🎓 Open PAF-IAST LMS Portal
            </button>
          </div>
        </div>
      </div>

      <SocialIcons />
    </>
  );
};

export default LmsPortal;
