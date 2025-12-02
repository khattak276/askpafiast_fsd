import { FC, useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';
import type { Engine } from 'tsparticles-engine';



// 84



const ParticlesBackground: FC = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  return (
    <Particles
      id="particles-js"
      init={particlesInit}
      options={{
        fullScreen: {
          enable: true,
          zIndex: -1
        },
        particles: {
          number: {
            value: 100,
            density: {
              enable: true,
              area: 800
            }
          },
          color: {
            value: ["#000000", "#D4AF37", "#C0C0C0"] // Black, Gold, Silver
          },
          shape: {
            type: "circle",
            stroke: {
              width: 0,
              color: "#000000"
            },
            polygon: {
              sides: 6
            }
          },
          opacity: {
            value: 0.6,
            random: true,
            animation: {
              enable: true,
              speed: 0.8,
              minimumValue: 0.2,
              sync: false
            }
          },
          size: {
            value: 4,
            random: true,
            animation: {
              enable: true,
              speed: 20,
              minimumValue: 0.5,
              sync: false
            }
          },
          links: {
            enable: true,
            distance: 100,
            color: "#ffffff",
            opacity: 0.5,
            width: 1
          },
          move: {
            enable: true,
            speed: 1.3,
            direction: "none",
            random: true,
            straight: false,
            outModes: {
              default: "out"
            },
            bounce: true,
            attract: {
              enable: false,
              rotateX: 800,
              rotateY: 1400
            }
          }
        },
        interactivity: {
          detectsOn: "canvas",
          events: {
            onHover: {
              enable: true,
              mode: ["grab", "bubble"]
            },
            onClick: {
              enable: true,
              mode: ["push", "repulse"]
            },
            resize: true
          },
          modes: {
            grab: {
              distance: 150,
              links: {
                opacity: 0.8
              }
            },
            bubble: {
              distance: 200,
              size: 8,
              duration: 2,
              opacity: 0.8,
              speed: 2
            },
            repulse: {
              distance: 100,
              duration: 0.4
            },
            push: {
              quantity: 1
            }
          }
        },
        retina_detect: true,
        background: {
          color: "#1c1c1e"
        }
      }}
    />
  );
};

export default ParticlesBackground;
