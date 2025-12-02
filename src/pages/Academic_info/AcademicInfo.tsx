import type { FC } from 'react';
import { useEffect, useLayoutEffect } from 'react';
import './acadamicinfo.css';
import SocialIcons from '../../components/SocialIcons';
import Topbar from '../../components/Topbar';
import Back from '../../components/Back';
import BackToTop from '../../components/BackToTop';
import AskButton from '../../components/AskButton';

const AcademicInfo: FC = () => {
  // 🔹 Departments – from screenshots
  const departments = [
    { name: 'School of Computing Sciences', icon: '💻' },
    { name: 'Department of Electrical & Computer Engineering', icon: '⚡' },
    { name: 'Department of Biological and Health Sciences', icon: '🧬' },
    { name: 'School of Design Art and Architecture Technologies', icon: '🎨' },
    { name: 'Department of Pharmaceutical Science', icon: '💊' },
    { name: 'Department of Biomedical Engineering (Upcoming)', icon: '🩺' },
    { name: 'Department of Chemical and Energy Engineering', icon: '⚗️' },
    { name: 'Department of Materials Science & Engineering', icon: '🧪' },
    { name: 'Department of Mechanical & Manufacturing Engineering', icon: '🛠️' },
    { name: 'Department of Mineral Processing Engineering', icon: '⛏️' },
    { name: 'Department of Mining Engineering', icon: '🚜' },
    { name: 'Department of Transportation Engineering', icon: '🚆' },
    { name: 'Department of Food Engineering', icon: '🍽️' },
    {
      name: 'Department of Civil Engineering and Town Planning (Upcoming)',
      icon: '🏗️'
    },
    {
      name: 'School of Business, Entrepreneurship, and Professional Development',
      icon: '📊'
    },
    { name: 'Department of English and Modern Languages', icon: '📚' }
  ];

  // 🔹 Full program lists (UG + Graduate)
  const undergradPrograms = [
    'BS Computer Engineering',
    'BE Electrical Engineering',
    'BS Robotics',
    'BE Chemical Engineering',
    'BE Materials Engineering',
    'BS Artificial Intelligence',
    'BS Computer Science',
    'BS Cyber Security',
    'BS Data Science',
    'BS Software Engineering',
    'BS Applied Psychology',
    'Doctor of Physiotherapy (DPT)',
    'Pharm.D (Doctor of Pharmacy)',
    'BS Biomedical Sciences',
    'BS Medical Lab Technology',
    'BS Biotechnology',
    'BS Accounting and Finance',
    'BS Entrepreneurship and Innovation',
    'BS Business Analytics',
    'Bachelor of Business Administration (BBA)',
    'BS English',
    'Bachelor of Architecture (B. Arch, 5 Years)',
    'BS Animation Design',
    'BS Film and TV',
    'BS Fashion Design',
    'BS Fine Arts',
    'BS Information Design',
    'BS Interior Design',
    'BS Textile Design',
    'BS Biomedical Engineering Technology',
    'BS Mechanical Engineering Technology'
  ];

  const graduatePrograms = [
    'MS Artificial Intelligence',
    'MS Data Communication and Networks',
    'MS Data Science',
    'MS Information Security',
    'MS Biomedical Sciences',
    'MS Biotechnology',
    'MS Embedded Systems and IoTs',
    'MS Energy and Power Systems',
    'MS Environmental, Process, and Energy Engineering',
    'MS Materials Engineering',
    'MS Mechanical Manufacturing and Automation',
    'MS Mechatronics Engineering',
    'MS Mining Engineering',
    'MS Mineral Process Engineering',
    'MS Railway System Engineering',
    'MS Transportation Systems Engineering',
    'MBA – Master of Business Administration (1.5 & 2 Years)'
  ];

  // 🔹 Updated full grading scale
  const grades = [
    { grade: 'A', points: '4.00', description: 'Excellent' },
    { grade: 'A-', points: '3.67', description: 'Very Strong' },
    { grade: 'B+', points: '3.33', description: 'Very Good' },
    { grade: 'B', points: '3.00', description: 'Good' },
    { grade: 'B-', points: '2.67', description: 'Above Average' },
    { grade: 'C+', points: '2.33', description: 'Satisfactory' },
    { grade: 'C', points: '2.00', description: 'Acceptable' },
    { grade: 'C-', points: '1.67', description: 'Marginal Pass' },
    { grade: 'D+', points: '1.33', description: 'Below Average' },
    { grade: 'D', points: '1.00', description: 'Poor Pass' },
    { grade: 'F', points: '0.00', description: 'Fail' }
  ];

  // 🔹 12 abbreviation blocks (will become 12 li cards)
  const abbreviations = [
    { code: 'CH', term: 'Credit Hours' },
    { code: 'SCH', term: 'Semester Credit Hours' },
    { code: 'CCH', term: 'Cumulative Credit Hours' },
    { code: 'SGPA', term: 'Semester Grade Point Average' },
    { code: 'CGPA', term: 'Cumulative Grade Point Average' },
    { code: 'GP', term: 'Grade Points' },
    { code: 'SGP', term: 'Semester Grade Points' },
    { code: 'CGP', term: 'Cumulative Grade Points' },
    {
      code: '*RPT',
      term: 'Repeat Course – best grade and credit hours are counted'
    },
    {
      code: '‡OPT',
      term: 'Optional elective course – not counted in total credit hours or SGPA/CGPA'
    },
    {
      code: '#SBT(x)',
      term: 'Substitute course for an earlier attempt (x); CH and GP of earlier course are not counted'
    },
    {
      code: 'GPA',
      term: 'Grade Point Average – overall measure of academic performance'
    }
  ];

  // 🔹 8 academic standing blocks
  const academicStanding = [
    {
      title: "Rector's List of Honors",
      text: 'If the semester GPA is 4.00.'
    },
    {
      title: "Dean's List of Honors",
      text: 'If the semester GPA is greater than 3.50 but less than 4.00.'
    },
    {
      title: 'Good Standing',
      text: 'If the semester GPA is at least 2.00 and the student is not on probation or withdrawal.'
    },
    {
      title: 'Academic Probation',
      text: 'If the semester GPA is less than 2.00 (Undergraduate).'
    },
    {
      title: 'Academic Withdrawal',
      text: 'If the semester GPA is less than 2.00 for two regular semesters at the end of academic year or if the cumulative GPA falls below 2.00 in the first 3 semesters.'
    },
    {
      title: 'Semester GPA (SGPA)',
      text: 'Grade points earned in a semester divided by the total credit hours registered in that semester.'
    },
    {
      title: 'Cumulative GPA (CGPA)',
      text: 'Total grade points accumulated over the entire program divided by the total credit hours attempted.'
    },
    {
      title: 'Degree Completed',
      text: 'If all the requirements of the degree program are complete.'
    }
  ];

  useLayoutEffect(() => {
    document.body.classList.add('topbar-mode');
    return () => document.body.classList.remove('topbar-mode');
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -100px 0px' }
    );

    document
      .querySelectorAll('section')
      .forEach(section => observer.observe(section));

    const handleMouseMove = (e: MouseEvent) => {
      document
        .querySelectorAll('.academic-page section')
        .forEach(card => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
          (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
        });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.body.classList.add('academic-body');

    return () => {
      document
        .querySelectorAll('section')
        .forEach(section => observer.unobserve(section));
      document.removeEventListener('mousemove', handleMouseMove);
      document.body.classList.remove('academic-body');
    };
  }, []);

  return (
    <div className="complete">
      <Back />
      <Topbar />
      <BackToTop />
      <AskButton />

      <header>
        <h1>Academic Information</h1>
        <p>
          Discover our world-class academic programs at PAF-IAST, where
          cutting-edge research meets practice-oriented education. Our
          curriculum is designed to meet global standards while addressing local
          industry needs.
        </p>
      </header>

      <div className="academic-page">
        {/* 1. Departments */}
        <section>
          <h2>Departments</h2>
          <p>
            These are the main academic departments and schools that offer
            degree programs at PAF-IAST:
          </p>
          <ul>
            {departments.map((dept, index) => (
              <li key={index}>
                <span className="program-icon">{dept.icon}</span>
                <span className="program-name">{dept.name}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 2. Side-by-side UG / Graduate program lists */}
        <div className="programs-row">
          <section className="program-list-card undergrad-programs">
            <h2>Undergraduate Programs</h2>
            <p>
              Full list of bachelor’s level programs currently offered at
              PAF-IAST:
            </p>
            <ul className="simple-program-list">
              {undergradPrograms.map(name => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </section>

          <section className="program-list-card graduate-programs">
            <h2>Graduate Programs</h2>
            <p>
              Master’s and postgraduate programs designed for advanced
              specialization and research:
            </p>
            <ul className="simple-program-list">
              {graduatePrograms.map(name => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </section>
        </div>

        {/* 3. Semester System */}
        <section>
          <h2>Semester System</h2>
          <p>Our academic calendar is structured into two main semesters:</p>
          <ul>
            <li>
              <strong>Fall Semester</strong>
              <p>16 weeks from September to January</p>
            </li>
            <li>
              <strong>Spring Semester</strong>
              <p>16 weeks from February to June</p>
            </li>
            <li>
              <strong>Summer Session</strong>
              <p>Optional 8-week term for fast-tracks</p>
            </li>
          </ul>
        </section>

        {/* 4. Credit Hours */}
        <section>
          <h2>Credit Hour System</h2>
          <p>Our credit system ensures comprehensive learning:</p>
          <ul>
            <li>
              <strong>Undergraduate Programs</strong>
              <p>130-136 credit hours</p>
            </li>
            <li>
              <strong>Graduate Programs</strong>
              <p>30-36 credit hours</p>
            </li>
            <li>
              <strong>Credit Definition</strong>
              <p>1 credit = 1 hr lecture / 3 hrs lab</p>
            </li>
          </ul>
        </section>

        {/* 5. Grading System */}
        <section className="grading-card">
          <h2>Grading System</h2>
          <p>Fair and transparent evaluation based on GPA scale:</p>
          <ul>
            {grades.map((grade, index) => (
              <li key={index}>
                <span>{grade.grade}</span>
                <div className="grade-details">
                  <span>{grade.points}</span>
                  <small>{grade.description}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 6. Attendance */}
        <section>
          <h2>Attendance Policy</h2>
          <ul>
            <li>
              <strong>Minimum Requirement</strong>
              <p>75% attendance mandatory</p>
            </li>
            <li>
              <strong>Consequences</strong>
              <p>Below 75% = exam disqualification</p>
            </li>
            <li>
              <strong>Monitoring</strong>
              <p>Tracked through digital systems</p>
            </li>
          </ul>
        </section>

        {/* 7. Academic Integrity */}
        <section>
          <h2>Academic Integrity</h2>
          <ul>
            <li>
              <strong>Zero Tolerance</strong>
              <p>No plagiarism or cheating</p>
            </li>
            <li>
              <strong>Consequences</strong>
              <p>May lead to failure or expulsion</p>
            </li>
            <li>
              <strong>Support</strong>
              <p>Help available for citations/research</p>
            </li>
          </ul>
        </section>

        {/* 8. Abbreviations – SAME style as attendance / integrity */}
        <section className="abbreviations-card">
          <h2>Abbreviations</h2>
          <p>Common terms used on transcripts and academic records:</p>
          <ul>
            {abbreviations.map(item => (
              <li key={item.code}>
                <strong>{item.code}</strong>
                <p>{item.term}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* 9. Academic Standing – SAME style as above */}
        <section className="standing-card">
          <h2>Academic Standing</h2>
          <p>
            Academic standing is determined by the semester GPA and cumulative
            GPA (CGPA):
          </p>
          <ul>
            {academicStanding.map(item => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <SocialIcons />
      </div>
    </div>
  );
};

export default AcademicInfo;
