import { FC, useEffect, useRef, useCallback } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './ContactUs.css';
import Topbar from '../../components/Topbar';
import Back from '../../components/Back';
import BackToTop from '../../components/BackToTop';
import AskButton from '../../components/AskButton';
import SocialIcons from '../../components/SocialIcons';
import { FaLink, FaFacebookF, FaLinkedinIn, FaTwitter } from "react-icons/fa";

/* 🔮 Tilt Configuration */
const TILT_INTENSITY = 50;
const PERSPECTIVE = 800;
const TRANSITION_MS = 600;

const useTilt = (root: React.RefObject<HTMLElement>) => {
  const attach = useCallback(() => {
    const cards = root.current?.querySelectorAll<HTMLElement>('.team-card');
    if (!cards?.length) return;

    cards.forEach(card => {
      card.style.transform = `perspective(${PERSPECTIVE}px)`;
      card.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(0.23,1,0.32,1)`;

      let hovering = false;

      const onEnter = () => { hovering = true; };

      const onMove = (e: MouseEvent) => {
        if (!hovering) return;
        const rect = card.getBoundingClientRect();
        const rotateX = -(e.clientY - rect.top - rect.height / 2) / TILT_INTENSITY;
        const rotateY = (e.clientX - rect.left - rect.width / 2) / TILT_INTENSITY;

        card.style.transform =
          `perspective(${PERSPECTIVE}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03,1.03,1.03)`;
      };

      const onLeave = () => {
        hovering = false;
        card.style.transform = `perspective(${PERSPECTIVE}px) rotateX(0deg) rotateY(0deg)`;
      };

      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);

      (card as any).__cleanup = () => {
        card.removeEventListener('mouseenter', onEnter);
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
      };
    });
  }, [root]);

  useEffect(() => {
    attach();
    return () =>
      root.current?.querySelectorAll<HTMLElement>('.team-card')
        .forEach(c => (c as any).__cleanup?.());
  }, [attach, root]);
};

const ContactUs: FC = () => {
  const teamRef = useRef<HTMLDivElement>(null);
  useTilt(teamRef);

  useEffect(() => {
    AOS.init({ duration: 900, offset: 40, once: true, easing: 'ease-out-cubic' });

    document.body.classList.add('topbar-mode', 'about-page');
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    if (sidebar) sidebar.style.display = 'none';

    return () => {
      document.body.classList.remove('topbar-mode', 'about-page');
      if (sidebar) sidebar.style.display = 'flex';
    };
  }, []);

  return (
    <div className="contact-container">
      <Topbar />
      <Back />
      <BackToTop />
      <AskButton />

      {/* Header */}
      <header data-aos="fade-up" className="contact-header">
        <h1>Contact the Ask-PAF-IAST Team</h1>
        <p>
          We are a group of passionate students from <b>Pak-Austria Fachhochschule: Institute of Applied Sciences and Technology (PAF-IAST)</b>, representing the <b>Computer Science</b> and <b>Information Technology</b> departments.
        </p>
        <p>
          Our goal is to merge innovation with technology — developing intelligent solutions that make accessing university information faster, smarter, and more interactive.  
          If you have ideas, suggestions, or feedback to improve this assistant, we’d love to hear from you.
        </p>
      </header>

      {/* Team Section */}
      <section className="team" data-aos="fade-up" ref={teamRef}>
        <h2>Meet Our Developers</h2>
        <div className="team-row">
          {[
            { img: 'haseebkhattak.jpeg', name: 'Abdul Haseeb Khattak', role: 'Lead Developer & AI System Architect' },
            { img: 'tariqshah.jpeg', name: 'Tariq Shahnawaz', role: 'Frontend Developer & UI/UX Visionary' },
            { img: 'usmaniqbal.jpeg', name: 'Usman Iqbal Shah', role: 'Backend Engineer & Database Specialist' },
            { img: 'rasheem.jpeg', name: 'Muhammad Rasheem', role: 'Research Associate & Integration Engineer' },
          ].map((dev, i) => (
            <div className="team-card" key={dev.name} data-aos="fade-up" data-aos-delay={i * 150}>
              <img src={`/images/Team/${dev.img}`} alt={dev.name} />
              <h4>{dev.name}</h4>
              <p>{dev.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="contact-form-section" data-aos="fade-up">
        <div className="contact-form-card">
          <h2>Get in Touch</h2>

          <div className="social-icons-row">
            <a href="#"><FaLink className="auth-icon" /></a>
            <a href="#"><FaFacebookF className="auth-icon" /></a>
            <a href="#"><FaLinkedinIn className="auth-icon" /></a>
            <a href="#"><FaTwitter className="auth-icon" /></a>
          </div>

          <p className="form-note">
            Fill out this form or reach out through our social channels — we’ll respond as soon as possible.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert('✅ Message sent successfully!');
            }}
          >
            <div className="form-row">
              <input type="text" placeholder="First Name" required />
              <input type="text" placeholder="Last Name" required />
            </div>

            <input type="email" placeholder="Email Address" required />

            <div className="form-row">
              <input type="text" placeholder="Department" required />
              <input type="text" placeholder="Semester" required />
            </div>

            <textarea placeholder="Your Message..." required></textarea>

            <button type="submit">Submit</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <SocialIcons />
    </div>
  );
};

export default ContactUs;
