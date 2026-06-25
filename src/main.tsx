import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/site.css';

// Lenis smooth scroll
import Lenis from 'lenis';

const lenis = new Lenis({
  duration: 0.6,
  easing: (t: number) => 1 - Math.pow(1 - t, 3),
  smoothWheel: true,
  lerp: 0.06,       // snappier = fewer tail frames after scroll input
  wheelMultiplier: 1,
  touchMultiplier: 1.5,
});

function raf(time: number) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
