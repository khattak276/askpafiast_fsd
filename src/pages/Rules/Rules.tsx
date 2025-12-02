import type { FC } from 'react';

import Topbar from '../../components/Topbar';
import './rules.css'; // ✅ CSS styling
import Back from '../../components/Back';

import BackToTop from '../../components/BackToTop';

import  AskButton  from '../../components/AskButton';
import SocialIcons from '../../components/SocialIcons';

const Rules: FC = () => {
  return (
    <>
      

      <div className="rules-page">
        <div className="rules-container">
          
          {/* ✅ Back button placed here */}
          <Topbar />
          <Back />
          <BackToTop />
          <AskButton/>
        <header>
          <h1>PAF-IAST Rules & Regulations Overview</h1>
          </header>
          <p>
            The rules and regulations at Pak-Austria Fachhochschule: Institute of Applied Sciences and Technology (PAF-IAST)
            are designed to ensure a disciplined, respectful, and inclusive academic environment. They cover a wide range 
            of areas including academic integrity, hostel conduct, classroom behavior, use of campus resources, student 
            societies, and general campus discipline. Students are required to maintain 75% attendance, follow exam 
            protocols, respect faculty and peers, and avoid misconduct such as plagiarism, harassment, or political activity.
          </p>


          <p>
            For the full set of policies, guidelines, and disciplinary procedures, please refer to the comprehensive 
            PDF document linked below.
          </p>

          <div className="pdf-link-wrapper">
            <a href="/static/rules.pdf" className="pdf-link" target="_blank" rel="noopener noreferrer">
              📄 View Full Rules & Regulations (PDF)
            </a>
          </div>
        </div>
      </div>
      <SocialIcons />
    </>
  );
};

export default Rules;
