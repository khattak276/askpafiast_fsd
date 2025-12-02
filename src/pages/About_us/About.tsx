/*  src/pages/About.tsx  */
import {
  FC,
  useEffect,
  useRef,
  useCallback,
  RefObject
} from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './About.css';
import Back from '../../components/Back';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faFacebook, faInstagram, faTwitter } from '@fortawesome/free-brands-svg-icons';
import SocialIcons from '../../components/SocialIcons';
// import { useState } from 'react';
import Topbar from '../../components/Topbar';

import BackToTop from '../../components/BackToTop';
import AskButton from '../../components/AskButton';

/* ------------------------------------------------------------------ */
/*  Custom hook – 3-D tilt for .card and .team-card                   */
/* ------------------------------------------------------------------ */

const TILT_INTENSITY = 50;
const PERSPECTIVE = 800;
const TRANSITION_MS = 600;

const useTilt = (root: RefObject<HTMLElement>) => {
  const attach = useCallback(() => {
    const cards = root.current?.querySelectorAll<HTMLElement>('.card, .team-card');
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
          `perspective(${PERSPECTIVE}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
      };

      const onLeave = () => {
        hovering = false;
        card.style.transform =
          `perspective(${PERSPECTIVE}px) rotateX(0deg) rotateY(0deg)`;
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
      root.current?.querySelectorAll<HTMLElement>('.card, .team-card')
        .forEach(c => (c as any).__cleanup?.());
  }, [attach, root]);
};

/* ------------------------------------------------------------------ */
/*  About page component                                              */
/* ------------------------------------------------------------------ */

const About: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  /* AOS scroll-reveal */
  useEffect(() => {
    AOS.init({ duration: 800, offset: 40, once: true, easing: 'ease-out-cubic' });
  }, []);

  /* Glow that follows the mouse on tour cards */
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      containerRef.current?.querySelectorAll<HTMLElement>('.tour-card')
        .forEach(card => {
          const r = card.getBoundingClientRect();
          card.style.setProperty('--mouse-x', `${e.clientX - r.left}px`);
          card.style.setProperty('--mouse-y', `${e.clientY - r.top}px`);
          card.setAttribute('data-mouse-moved', 'true');
        });
    };
    const handleLeave = (e: MouseEvent) => {
      (e.target as HTMLElement)
        .closest('.tour-card')
        ?.removeAttribute('data-mouse-moved');
    };

    const cards = containerRef.current?.querySelectorAll<HTMLElement>('.tour-card');
    cards?.forEach(c => {
      c.addEventListener('mousemove', handleMove);
      c.addEventListener('mouseleave', handleLeave);
    });

    return () => cards?.forEach(c => {
      c.removeEventListener('mousemove', handleMove);
      c.removeEventListener('mouseleave', handleLeave);
    });
  }, []);

  /* 3-D tilt on highlight / team cards */
  useTilt(containerRef);

  useEffect(() => {
    document.body.classList.add('topbar-mode');
    return () => document.body.classList.remove('topbar-mode');
  }, []);

  /* Hide global UI bits only while this page is mounted */
  useEffect(() => {
    document.body.classList.add('about-page');
    return () => document.body.classList.remove('about-page');
  }, []);

  /* --------------------------- JSX --------------------------- */
  return (
    <div className="container-about" ref={containerRef}>
      <Topbar />
      <Back />
      <BackToTop />
      <AskButton />

      {/* ---------- Header ---------- */}
      <header data-aos="fade-up">
        <h1>What is PAF-IAST?</h1>
        <p>
          Pak-Austria Fachhochschule: Institute of Applied Sciences and Technology
          (PAF-IAST) is a pioneering public sector university in Haripur, aiming
          to bridge academia and industry through cutting-edge education, applied
          research, and global partnerships with Austrian and Chinese universities.
        </p>
      </header>

      {/* ---------- Highlights ---------- */}
      <section className="highlights" data-aos="fade-up">
        {[
          {
            title: 'Our Approach',
            delay: 100,
            text:
              'We blend academic excellence with practical industrial skills. ' +
              'Our hands-on curriculum prepares students for real-world challenges ' +
              'through state-of-the-art labs and industry-aligned programs.'
          },
          {
            title: 'Our Vision',
            delay: 200,
            text:
              'To become a global leader in applied sciences and technology, ' +
              'PAF-IAST builds strong academic-industrial linkages that shape ' +
              'innovation-driven professionals capable of transforming the nation.'
          },
          {
            title: 'Our Perspective',
            delay: 300,
            text:
              'Education is a bridge between ideas and implementation. With ' +
              'international partnerships and a research focus, we nurture ' +
              'curiosity and critical thinking in every student.'
          }
        ].map(({ title, delay, text }) => (
          <div className="card" key={title} data-aos="fade-up" data-aos-delay={delay}>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </section>

      {/* ---------- Team ---------- */}

            {/* ---------- Team ---------- */}
      <section className="team" data-aos="fade-up">
        <h2>Meet the Faces Behind the System</h2>

        <div className="team-row">
          {[
            ['mujahid.jpg', 'Dr. Mohammad Mujahid', 'Rector', 100],
            ['naseer.jpg', 'Dr. Nasser Ali Khan', 'Project Director', 200],
            ['arshad.jpg', 'Dr. Arshad Hussain', 'Director Establishment', 300]
          ].map(([img, name, role, d]) => (
            <div className="team-card" key={name} data-aos="fade-up" data-aos-delay={d as number}>
              <img src={`/images/personalities/${img}`} alt={name as string} />
              <div className="card-inner">
                <h4>{name}</h4><p>{role}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="team-row">
          {[
            ['hamid.jpg', 'Dr. Abdul Hameed', 'Director Finance/HRM', 100],
            ['ali.jpg', 'Syed Ali Raza', 'Manager IT', 200]
          ].map(([img, name, role, d]) => (
            <div className="team-card" key={name} data-aos="fade-up" data-aos-delay={d as number}>
              <img src={`/images/personalities/${img}`} alt={name as string} />
              <h4>{name}</h4><p>{role}</p>
            </div>
          ))}
        </div>
      </section>

<section className="tour" data-aos="fade-up">
  <h2>CAMPUS TOUR</h2>

  {[
    {
      title: 'University Gate',
      img: '/images/campus/maingate.jpeg',
      desc: 'Main entry point of the university with 24/7 security and a welcoming architectural design.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'Main Gate – Front View',
          desc: 'Primary entrance where students and visitors arrive on campus.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Security Checkpoint',
          desc: 'Security staff ensures safe entry and exit for everyone.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Approach Road',
          desc: 'Smooth road leading directly towards the main gate.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Evening Ambience',
          desc: 'Warm lighting creates a welcoming feel after sunset.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Name Plate & Branding',
          desc: 'University name and logo proudly displayed at the gate.'
        }
      ]
    },
    {
      title: 'Admin Block',
      img: '/images/campus/admin.jpeg',
      desc: 'Central hub for administrative operations, including finance, HRM, IT, and planning departments.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'Admin Block – Main Front',
          desc: 'Main façade where most visitors first enter the building.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Lobby & Reception',
          desc: 'Reception area for guidance, appointments, and general queries.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Office Corridors',
          desc: 'Neat corridors connecting various administrative departments.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Side Lawn Area',
          desc: 'Green space beside the admin block for short breaks.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Backside View',
          desc: 'Rear elevation connecting to service and utility areas.'
        }
      ]
    },
    {
      title: 'A1 Block',
      img: '/images/campus/a1block.jpeg',
      desc: 'Dedicated to foundational sciences and general education programs for all departments.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'A1 Block – Front Elevation',
          desc: 'Main side of A1 used by students for daily classes.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Ground-Level Corridor',
          desc: 'Corridor connecting classrooms and lecture halls.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Classroom Entry',
          desc: 'Standard classroom entrance used throughout A1 block.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Staircase Area',
          desc: 'Access point to upper floors and additional rooms.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Outer Sitting Spot',
          desc: 'Small sitting area where students can relax between classes.'
        }
      ]
    },
    {
      title: 'A2 Block',
      img: '/images/campus/a2block.jpeg',
      desc: 'Home to laboratories, seminar rooms, and engineering classrooms for advanced practical work.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'A2 Block – Front Side',
          desc: 'Main outlook of A2 visible from the approach road.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Laboratory Corridor',
          desc: 'Hallway leading to different engineering and science labs.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Seminar Room Area',
          desc: 'Dedicated space for seminars, talks, and technical sessions.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Equipment & Lab Setup',
          desc: 'Workbenches and gear used for practical experiments.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Rear View of A2',
          desc: 'Backside that connects towards service and open areas.'
        }
      ]
    },
    {
      title: 'B1 Block',
      img: '/images/campus/b1block.jpeg',
      desc: 'Facilitates computer science and IT-related programs with modern computing labs and smart rooms.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'B1 – CS & IT Front',
          desc: 'Main entrance used by CS and IT students.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Computer Lab Entry',
          desc: 'Access point to the main computing laboratories.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Lab Corridor',
          desc: 'Corridor connecting multiple specialized computer labs.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Smart Classroom',
          desc: 'Equipped with multimedia and digital teaching tools.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Outdoor Sitting Area',
          desc: 'Small outdoor zone for short breaks and discussions.'
        }
      ]
    },
    {
      title: 'B2 Block',
      img: '/images/campus/b2block.jpeg',
      desc: 'Equipped for multimedia, game design, and AI research with creative studios and tech hubs.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'B2 – Creative Front',
          desc: 'Facade representing the creative and tech side of the campus.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Studio Corridor',
          desc: 'Passage leading to multimedia and recording studios.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Workstation Area',
          desc: 'Configured work desks for design and development work.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Collaboration Zone',
          desc: 'Shared space where teams can brainstorm and prototype.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Backside Lawn',
          desc: 'Open outdoor space next to B2 block.'
        }
      ]
    },
    {
      title: 'C1 Block',
      img: '/images/campus/c1block.jpeg',
      desc: 'Focuses on health sciences, including programs in physiotherapy, pharmacy, and biotechnology.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'C1 – Health Sciences Front',
          desc: 'Main view of C1 block used by medical-related programs.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Lab Hallway',
          desc: 'Hall connecting various health science labs.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Practical Lab Entrance',
          desc: 'Entry towards physiotherapy and pharma practical rooms.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Classroom Corridor',
          desc: 'Standard teaching area for theory courses in C1.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Surrounding View',
          desc: 'Outer view of C1 with greenery and walkways.'
        }
      ]
    },
    {
      title: 'C2 Block',
      img: '/images/campus/c2block.jpeg',
      desc: 'Technology Park hosting startups, industry partners, and advanced tech incubation centers.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'C2 – Tech Park Front',
          desc: 'Main frontage where startups and partners usually enter.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Incubation Entrance',
          desc: 'Dedicated entrance for incubation offices and teams.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Co-working Area',
          desc: 'Shared workspace used by multiple startup teams.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Meeting Room Zone',
          desc: 'Enclosed rooms for client and internal meetings.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Outdoor Tech Park View',
          desc: 'Exterior open space around the C2 tech park.'
        }
      ]
    },
    {
      title: 'Library',
      img: '/images/campus/library.jpeg',
      desc: 'Modern digital library with extensive physical and online resources, including research journals and study spaces.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'Library – Main Entrance',
          desc: 'Primary entry into the central library building.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Reading Hall',
          desc: 'Quiet reading area with individual and group tables.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Bookshelves & Stacks',
          desc: 'Organized sections with course, reference, and research books.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Digital Resource Corner',
          desc: 'Systems and access points for e-journals and databases.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Study Pods',
          desc: 'Small focused spaces ideal for group study and projects.'
        }
      ]
    },
    {
      title: 'Arts and Sculpture Area',
      img: '/images/campus/artsandsculpture.jpeg',
      desc: 'Creative corner for arts, sculpture, and cultural showcases.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'Main Sculpture View',
          desc: 'Centerpiece sculpture highlighting the artistic spirit of the campus.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Art Display Zone',
          desc: 'Spot where paintings and student artwork are occasionally displayed.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Walkway & Art',
          desc: 'Pathway decorated with smaller sculptural elements.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Event / Showcase Area',
          desc: 'Open platform used for cultural and art-related events.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Sitting Area',
          desc: 'Benches and seating under open sky near the sculptures.'
        }
      ]
    },
    {
      title: 'Faculty Lodges',
      img: '/images/campus/facultylodges.jpeg',
      desc: 'Residential area for faculty members with peaceful surroundings and dedicated facilities.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'Lodges – Front Row',
          desc: 'Front-facing units reserved for faculty members.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Green Lawn',
          desc: 'Well-maintained lawn between or around the lodges.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Parking Near Lodges',
          desc: 'Parking facilities conveniently close to the residences.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Connecting Pathways',
          desc: 'Walkways linking different lodge units together.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Evening View',
          desc: 'Warm and calm ambience at sunset time.'
        }
      ]
    },
    {
      title: 'STC (Student-Teacher Café)',
      img: '/images/campus/stc.jpeg',
      desc: 'Vibrant hub for interaction and relaxation between students and faculty with quality dining options.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'STC – Main Entrance',
          desc: 'Front view where everyone walks into the café.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Indoor Seating',
          desc: 'Comfortable indoor arrangement for meals and discussions.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Outdoor Seating',
          desc: 'Open-air tables for a relaxed café experience.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Service Counter',
          desc: 'Counter area where orders are placed and served.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Night View',
          desc: 'Café lit up in the evening with a cozy feel.'
        }
      ]
    },
    {
      title: 'Parking Area',
      img: '/images/campus/parking.jpeg',
      desc: 'Designated vehicle parking space for students, staff, and visitors.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'Parking Entrance',
          desc: 'Entry point into the main parking zone.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Car Parking Rows',
          desc: 'Neatly aligned rows for student and staff vehicles.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Bike Parking',
          desc: 'Dedicated space where bikes and scooters are parked.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Pedestrian Track',
          desc: 'Safe walking lane for moving towards the campus blocks.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Top View Angle',
          desc: 'Wider shot showing overall parking density and layout.'
        }
      ]
    },
    {
      title: 'University Vehicle Parking Area',
      img: '/images/campus/busstand.jpeg',
      desc: 'Pick-up/drop-off station for university transport buses and shuttles.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'Bus Stand – Front',
          desc: 'Main view where buses line up for pickup.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Waiting Area',
          desc: 'Students wait comfortably for buses here.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Bus Parking Bay',
          desc: 'Designated section where buses stop and rest between trips.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Road to Campus',
          desc: 'Stretch of road connecting bus stand to main blocks.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Evening Transport View',
          desc: 'Shot of buses and area during sunset hours.'
        }
      ]
    },
    {
      title: 'Bank',
      img: '/images/campus/bank.jpeg',
      desc: 'On-campus banking facility for students and staff, including ATM and account services.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'Bank Branch Front',
          desc: 'Primary entrance to the on-campus bank branch.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'ATM Corner',
          desc: '24/7 accessible ATM machines next to the branch.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Walkway Near Bank',
          desc: 'Connecting pathway used frequently by students for bank visits.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Side Angle of Bank',
          desc: 'Alternate view showing the surroundings and approach.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Nearby Sitting Area',
          desc: 'Benches and shade near the banking area.'
        }
      ]
    },
    {
      title: 'Boys Hostels',
      img: '/images/campus/boyshostels.jpeg',
      desc: 'Separate residential blocks for male students with study lounges and recreational spaces.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'Boys Hostel Gate',
          desc: 'Main controlled entry into the boys hostel premises.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Inner Courtyard',
          desc: 'Open internal space often used for casual gatherings.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Hostel Corridors',
          desc: 'Passageways connecting rooms and floors inside the hostel.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Common Room',
          desc: 'Shared room for indoor games, TV, and relaxation.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Side Hostel View',
          desc: 'Outer view highlighting the structure and number of floors.'
        }
      ]
    },
    {
      title: 'Girls Hostel',
      img: '/images/campus/girlshostel.jpeg',
      desc: 'Separate residential blocks for female students with secure access and modern facilities.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'Girls Hostel Entrance',
          desc: 'Secure entrance reserved for female residents only.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Hostel Lobby',
          desc: 'Lobby and reception zone inside the girls hostel.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Inner Lawn',
          desc: 'Green inner area for evening walks and relaxation.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Study / Common Area',
          desc: 'Shared study space within the hostel premises.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Side Elevation',
          desc: 'External side view showing the full hostel structure.'
        }
      ]
    },
    {
      title: 'Grounds (Cricket/Football)',
      img: '/images/campus/grounds.jpeg',
      desc: 'Open grounds for sports and large-scale university events.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'Cricket Ground View',
          desc: 'Main cricket pitch and boundary area.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Football Field',
          desc: 'Wide green field used for football and other events.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Spectator Stands',
          desc: 'Seating area for students and guests during matches.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Running Track',
          desc: 'Track commonly used for races and fitness activities.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Evening Ground View',
          desc: 'Grounds under a warm sunset sky.'
        }
      ]
    },
    {
      title: 'Tennis/Badminton Courts',
      img: '/images/campus/tennis.jpeg',
      desc: 'Well-maintained tennis and badminton courts available for students and staff.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'Tennis Court View',
          desc: 'Full-size court marked for standard tennis matches.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Court Side Angle',
          desc: 'Angle showing the net, markings, and surroundings.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Badminton Court',
          desc: 'Dedicated indoor/outdoor badminton playing space.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Net & Centre Area',
          desc: 'Close view of the net and central line.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Seating Beside Courts',
          desc: 'Benches for players and viewers near the court.'
        }
      ]
    },
    {
      title: 'Open Gym',
      img: '/images/campus/opengym.jpeg',
      desc: 'Outdoor fitness area with modern equipment for students and faculty.',
      mini: [
        {
          src: '/images/personalities/ali.jpg',
          label: 'Open Gym Equipment',
          desc: 'Machines and stations for basic outdoor workouts.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Workout Area Overview',
          desc: 'Full view of the open gym layout and space.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Pathway Near Gym',
          desc: 'Walkway that passes alongside the workout zone.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Side Angle View',
          desc: 'Side shot showing equipment alignment and spacing.'
        },
        {
          src: '/images/personalities/ali.jpg',
          label: 'Evening Gym View',
          desc: 'Open gym captured in softer evening lighting.'
        }
      ]
    }
  ].map(({ title, img, desc, mini }) => (
    <div className="tour-card expandable" key={title}>
      <div className="tour-main">
        <div className="tour-card-content">
          <h3>{title}</h3>
          <p>{desc}</p>
        </div>
        <img src={img} alt={title} className="tour-main-img" />
      </div>

      {/* Expanding drawer that pushes content down */}
      <div className="drawer">
        {mini.map((m, i) => (
          <div className="drawer-item" key={i}>
            <img src={m.src} alt={`${title} - ${m.label}`} />
            <div className="drawer-item-text">
              <h4>{m.label}</h4>
              <p>{m.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ))}
</section>



      <SocialIcons />
    </div>
  );
};

export default About;



