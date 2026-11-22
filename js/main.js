/**
 * main.js
 * Orquestador principal de la experiencia web romántica 3D:
 * "100 MANERAS DE DECIR TE EXTRAÑO ❤️"
 * Sincronización cinematográfica de las 12 Fases.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar animaciones maestras
  const animationManager = new AnimationManager();
  window.animationManagerInstance = animationManager;

  // 2. Inicializar el dial circular con las 100 frases (Círculo Exterior)
  const circularDial = new CircularDial({
    containerId: 'orbital-phrases-track',
    animationManager: animationManager
  });
  window.circularDialInstance = circularDial;

  // 3. Inicializar el controlador de scroll y navegación
  const scrollController = new ScrollController({
    circularDial: circularDial,
    animationManager: animationManager
  });
  window.scrollControllerInstance = scrollController;

  // 4. Iniciar la Secuencia Maestra (Fase 1 a 6)
  animationManager.startMasterSequence(() => {
    // Cuando la Fase 5 termina (cierre del círculo central), activar Fase 6 para scroll interactivo
    scrollController.activatePhase6();
  });

  // Botón de recarga / reinicio
  const btnRecharge = document.getElementById('btn-recharge-circle');
  if (btnRecharge) {
    btnRecharge.addEventListener('click', () => {
      scrollController.restart();
    });
  }

  // Botón de pantalla completa
  const btnFullscreen = document.getElementById('btn-fullscreen');
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      try {
        const doc = document;
        const docEl = document.documentElement;
        const isFull = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;
        if (!isFull) {
          const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
          if (req) {
            req.call(docEl).catch(err => console.warn(err));
          }
          btnFullscreen.innerHTML = '<span class="icon">⛶</span>';
        } else {
          const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
          if (exit) {
            exit.call(doc).catch(err => console.warn(err));
          }
          btnFullscreen.innerHTML = '<span class="icon">⛶</span>';
        }
      } catch (err) {
        console.warn('Fullscreen error:', err);
      }
    });
  }

  // Click en la guía inferior para avanzar paso a paso
  const scrollGuide = document.querySelector('.bottom-scroll-guide');
  if (scrollGuide) {
    scrollGuide.addEventListener('click', () => {
      scrollController.handleForward();
    });
  }

  // Botón Volver a Vivir la Experiencia en el Clímax
  const btnRestartClimax = document.getElementById('btn-restart-experience');
  if (btnRestartClimax) {
    btnRestartClimax.addEventListener('click', () => {
      scrollController.restart();
    });
  }

  // 5. Efecto interactivo de brillo y destello al pasar el cursor sobre el corazón
  const heartArchContainer = document.querySelector('.neon-heart-arch-container');
  const shineRay = document.getElementById('heart-shine-ray');

  if (heartArchContainer && shineRay) {
    let isShining = false;
    const triggerHeartShine = () => {
      if (isShining) return;
      isShining = true;
      gsap.fromTo(shineRay,
        { x: -450, opacity: 0.95 },
        {
          x: 550,
          opacity: 0,
          duration: 0.85,
          ease: 'power2.out',
          onComplete: () => {
            isShining = false;
          }
        }
      );
    };

    heartArchContainer.addEventListener('mouseenter', triggerHeartShine);
    heartArchContainer.addEventListener('touchstart', triggerHeartShine, { passive: true });
  }

  // Parallax sutil y fluido al mover el cursor (únicamente en desktop con mouse)
  let mouseParallaxTicking = false;
  const coupleWrapper = document.querySelector('.romantic-scene-left');
  const stageEl = document.querySelector('.universe-circle-stage');

  window.addEventListener('mousemove', (e) => {
    if (window.innerWidth <= 860 || mouseParallaxTicking) return; // En móviles se mantiene 100% centrado sin desvíos
    mouseParallaxTicking = true;
    requestAnimationFrame(() => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      if (coupleWrapper) {
        coupleWrapper.style.transform = `translate(${(x * 5).toFixed(1)}px, ${(y * 5).toFixed(1)}px)`;
      }
      if (stageEl) {
        stageEl.style.transform = `translate(${(x * -4).toFixed(1)}px, ${(y * -4).toFixed(1)}px)`;
      }
      mouseParallaxTicking = false;
    });
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (window.innerWidth <= 860) {
      if (coupleWrapper) coupleWrapper.style.transform = '';
      if (stageEl) stageEl.style.transform = '';
    }
  });

  console.log("🌌 100 MANERAS DE DECIR TE EXTRAÑO - Secuencia cinematográfica de 12 Fases inicializada.");
});
