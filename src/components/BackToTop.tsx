import { FC, useEffect, useState } from 'react';

const BackToTop: FC = () => {
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY / scrollHeight;
      setShowTopBtn(scrolled > 0.02);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {showTopBtn && (
        <button className="back-to-top" onClick={scrollToTop}>
          ↑ back to top
        </button>
      )}
    </>
  );
};

export default BackToTop;
