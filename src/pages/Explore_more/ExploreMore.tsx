// src/pages/Explore_more/ExploreMore.tsx
import type { FC } from 'react';
import { useRef } from 'react';

import Topbar from '../../components/Topbar';
import Back from '../../components/Back';
import BackToTop from '../../components/BackToTop';
import AskButton from '../../components/AskButton';
import SocialIcons from '../../components/SocialIcons';

import './ExploreMore.css';

const UNIVERSITY_BASE_URL = 'https://paf-iast.edu.pk/';

const ExploreMore: FC = () => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const handleOpenInNewTab = () => {
    // 🔒 Because of sandbox, we *don't* try to read iframe location.
    // Just open the official site in a new tab.
    window.open(UNIVERSITY_BASE_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="explore-page">
        {/* Same helpers as LMS / Rules page */}
        <Topbar />
        <Back />
        <BackToTop />
        <AskButton />

        <header>
          <h1>Explore PAF-IAST Website</h1>

          <p>
            Browse the official{' '}
            <b>
              Pak-Austria Fachhochschule: Institute of Applied Sciences and
              Technology (PAF-IAST)
            </b>{' '}
            website directly from the Ask-PAF-IAST portal. Check admissions,
            departments, news, notices, and more while still staying inside our
            assistant.
          </p>

          <p>
            If you prefer to continue in a separate tab, use the button below.
            Your Ask-PAF-IAST tab will remain open so you can switch back for
            quick help anytime.
          </p>
        </header>

        <div className="explore-container">
          <div className="explore-actions-row">
            <button
              type="button"
              className="explore-open-btn"
              onClick={handleOpenInNewTab}
            >
              🌐 Continue on PAF-IAST Website (New Tab)
            </button>
          </div>

          <div className="explore-iframe-wrapper">
            <iframe
              ref={iframeRef}
              src={UNIVERSITY_BASE_URL}
              title="PAF-IAST Official Website"
              className="explore-iframe"
              sandbox="allow-scripts allow-forms allow-same-origin"
              // ⚠ no allow-top-navigation → site can't easily kick user out of your app tab
            />
          </div>
        </div>
      </div>

      <SocialIcons />
    </>
  );
};

export default ExploreMore;
