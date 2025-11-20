/**
 * Lightweight confetti celebration utility
 * Triggers visual celebration for high-confidence matches and achievements
 */

export interface ConfettiConfig {
  colors?: string[];
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  zIndex?: number;
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

/**
 * Trigger confetti celebration
 */
export function celebrate(config: ConfettiConfig = {}): void {
  const {
    colors = DEFAULT_COLORS,
    particleCount = 50,
    spread = 70,
    origin = { x: 0.5, y: 0.5 },
    zIndex = 10000,
  } = config;

  // Check if running in browser
  if (typeof window === 'undefined') return;

  const duration = 2000;
  const animationEnd = Date.now() + duration;
  const particles: Array<{ x: number; y: number; vx: number; vy: number; color: string }> = [];

  // Create particle elements
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * spread - spread / 2;
    const speed = Math.random() * 30 + 30;
    particles.push({
      x: window.innerWidth * origin.x,
      y: window.innerHeight * origin.y,
      vx: Math.cos((angle * Math.PI) / 180) * speed,
      vy: Math.sin((angle * Math.PI) / 180) * speed + Math.random() * -30,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  // Create container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.pointerEvents = 'none';
  container.style.zIndex = zIndex.toString();
  document.body.appendChild(container);

  // Animate particles
  const animate = () => {
    const now = Date.now();
    if (now > animationEnd) {
      document.body.removeChild(container);
      return;
    }

    // Update and draw particles
    particles.forEach((particle, index) => {
      const elapsed = now - animationEnd + duration;
      const t = elapsed / duration;

      particle.x += particle.vx;
      particle.y += particle.vy + 98 * t * t; // gravity

      // Remove particle if off screen
      if (particle.y > window.innerHeight) {
        particles.splice(index, 1);
        return;
      }

      // Draw particle
      let element = container.querySelector(`[data-particle="${index}"]`) as HTMLElement;
      if (!element) {
        element = document.createElement('div');
        element.setAttribute('data-particle', index.toString());
        element.style.position = 'absolute';
        element.style.width = '10px';
        element.style.height = '10px';
        element.style.borderRadius = '50%';
        element.style.backgroundColor = particle.color;
        element.style.boxShadow = `0 0 10px ${particle.color}`;
        container.appendChild(element);
      }

      element.style.left = `${particle.x}px`;
      element.style.top = `${particle.y}px`;
      element.style.opacity = (1 - t).toString();
    });

    requestAnimationFrame(animate);
  };

  animate();
}

/**
 * Celebrate high-confidence reconciliation match (>95%)
 */
export function celebrateHighConfidence(): void {
  celebrate({
    colors: ['#10b981', '#3b82f6', '#8b5cf6'],
    particleCount: 80,
    spread: 60,
  });
}

/**
 * Celebrate job completion
 */
export function celebrateJobComplete(): void {
  celebrate({
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
    particleCount: 100,
    spread: 70,
  });
}

/**
 * Celebrate streak achievement
 */
export function celebrateStreak(): void {
  celebrate({
    colors: ['#f59e0b', '#ef4444', '#ec4899'],
    particleCount: 60,
    spread: 50,
  });
}
