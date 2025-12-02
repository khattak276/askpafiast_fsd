// src/components/SocialIcons.tsx
import { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram, faTwitter } from '@fortawesome/free-brands-svg-icons';

const SocialIcons: FC = () => {
  return (
    <div className="icons">
      <div className="footer-social-media">
        <a href="#" target="_blank" rel="noopener noreferrer">
          <div className="layer">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span className="fab fa-facebook-f">
              <FontAwesomeIcon icon={faFacebook} />
            </span>
          </div>
          <div className="text">Facebook</div>
        </a>

        <a href="#" target="_blank" rel="noopener noreferrer">
          <div className="layer">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span className="fab fa-instagram">
              <FontAwesomeIcon icon={faInstagram} />
            </span>
          </div>
          <div className="text">Instagram</div>
        </a>

        <a href="#" target="_blank" rel="noopener noreferrer">
          <div className="layer">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span className="fab fa-twitter">
              <FontAwesomeIcon icon={faTwitter} />
            </span>
          </div>
          <div className="text">Twitter</div>
        </a>
      </div>
    </div>
  );
};

export default SocialIcons;
