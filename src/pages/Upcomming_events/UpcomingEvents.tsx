import './upcomingevents.css';
import AskButton from '../../components/AskButton';
import Back from '../../components/Back';
import Topbar from '../../components/Topbar';
import BackToTop from '../../components/BackToTop';
import SocialIcons from '../../components/SocialIcons';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useEffect, useState } from 'react';

interface EventItem {
  image?: string;
  title: string;
  description: string;
  dateTime: string;
  venue: string;
  hosts: string;
  organizers: string;
}

const UpcomingEvents = () => {
  const [eventData, setEventData] = useState<{
    upcomingevents: EventItem[];
    noticeboard: EventItem[];
    updates: EventItem[];
  }>({
    upcomingevents: [],
    noticeboard: [],
    updates: []
  });

  useEffect(() => {
    AOS.init({ duration: 800, offset: 40, once: true, easing: 'ease-out-cubic' });

    const loadData = () => {
      const storedData = localStorage.getItem('eventsData');
      console.log("Loaded eventData from localStorage:", storedData);

      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          console.log("Parsed eventData:", parsed);
          setEventData({
            upcomingevents: parsed.upcomingevents || [],
            noticeboard: parsed.noticeboard || [],
            updates: parsed.updates || []
          });
        } catch (err) {
          console.error("Corrupted JSON. Resetting eventsData...");
          const defaultData = { upcomingevents: [], noticeboard: [], updates: [] };
          localStorage.setItem('eventsData', JSON.stringify(defaultData));
          setEventData(defaultData);
        }
      } else {
        const defaultData = { upcomingevents: [], noticeboard: [], updates: [] };
        localStorage.setItem('eventsData', JSON.stringify(defaultData));
        setEventData(defaultData);
      }
    };

    loadData();

    const handleStorageChange = () => loadData();
    const handleFocus = () => loadData();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    const cards = document.querySelectorAll('.event-box');

    const handleMouseMove = (e: Event) => {
      const card = e.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      const mouseX = (e as MouseEvent).clientX - rect.left;
      const mouseY = (e as MouseEvent).clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = -(mouseY - centerY) / (centerY * 1.2);
      const rotateY = (mouseX - centerX) / (centerX * 1.2);
      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    };

    const resetTransform = (e: Event) => {
      const card = e.currentTarget as HTMLElement;
      card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    };

    cards.forEach((card) => {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', resetTransform);
    });

    return () => {
      cards.forEach((card) => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', resetTransform);
      });
    };
  }, [eventData]);

  const renderEventBoxes = (events: EventItem[], count: number, type: string) => {
    const boxes = [];
    for (let i = 0; i < count; i++) {
      const event = events[i];
      boxes.push(
        <div className="event-box" key={`${type}-${i}`} data-aos="fade-up">
          <div className="event-content">
            <div className="event-image-placeholder">
              {event?.image ? (
                <img
                  src={event.image}
                  alt={type}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="empty-image">No Image</div>
              )}
            </div>
            <div className="event-info">
              {event ? (
                <>
                  <h3 style={{ textAlign: 'center' }}>Title: {event.title}</h3>
                  <p>Description: {event.description}</p>
                  <p>Date/Time + Venue: {event.dateTime} @ {event.venue}</p>
                  <p>Hosts: {event.hosts}</p>
                  <p>Organizers: {event.organizers}</p>
                </>
              ) : (
                <p style={{ textAlign: 'center', opacity: 0.6 }}>No event yet</p>
              )}
            </div>
          </div>
        </div>
      );
    }
    return boxes;
  };

  return (
    <div className="events-page">
      <AskButton />
      <Back />
      <Topbar />
      <BackToTop />

      {/* Upcoming Events */}
      <header className="main-heading" data-aos="fade-up">
        <h1>Upcoming Events</h1>
        <p>Join us for our exciting upcoming events and activities!</p>
      </header>
      <section className="highlights" data-aos="fade-up">
        <div className="grid-container upcoming-events-grid">
          {renderEventBoxes(eventData.upcomingevents, 3, 'Upcoming')}
        </div>
      </section>

      {/* Notice Board */}
      <header>
        <h1 className="main-heading">Notice Board</h1>
      </header>
      <div className="grid-container">
        {renderEventBoxes(eventData.noticeboard, 6, 'Notice')}
      </div>

      {/* Updates */}
      <header>
        <h1 className="main-heading">Updates</h1>
      </header>
      <div className="grid-container">
        {renderEventBoxes(eventData.updates, 6, 'Update')}
      </div>

      <SocialIcons />
    </div>
  );
};

export default UpcomingEvents;
