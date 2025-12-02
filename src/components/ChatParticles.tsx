// src/components/ChatParticles.tsx
import { FC, useCallback } from "react";
import Particles from "react-tsparticles";
import type { Engine } from "tsparticles-engine";
import { loadFull } from "tsparticles";

const ChatParticles: FC = () => {
  const initParticles = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  return (
    <Particles
      id="chat-particles"
      init={initParticles}
      // Canvas is controlled by CSS, not fullscreen
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
      options={{
        background: {
          // 🔹 Grey-ish chat background (you can tweak this)
          color: "#111827",
        },
        fullScreen: {
          enable: false, // stays inside parent container
          zIndex: 0,
        },
        fpsLimit: 60,
        detectRetina: true,
        particles: {
          number: { value: 160, density: { enable: true, area: 800 } },
          color: { value: "#fbbf24" },
          links: {
            enable: true,
            distance: 140,
            color: "#9ca3af",
            opacity: 0.5,
            width: 1,
          },
          move: {
            enable: true,
            direction: "none",
            speed: 1.2,
            outModes: { default: "bounce" },
          },
          opacity: { value: 0.6 },
          size: { value: { min: 1, max: 3 } },
        },
        interactivity: {
          events: {
            // 🔹 NO hover / click effects, so no lines to the cursor
            onHover: { enable: false, mode: [] },
            onClick: { enable: false, mode: [] },
          },
          modes: {
            grab: {
              distance: 160,
              links: { opacity: 0.8 },
            },
          },
        },
      }}
    />
  );
};

export default ChatParticles;
