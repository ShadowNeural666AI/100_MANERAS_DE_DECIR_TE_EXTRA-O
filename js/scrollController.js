/**
 * scrollController.js
 * Controlador de desplazamiento sincronizado con GSAP,
 * rueda del mouse, gestos táctiles y modo interactivo/automático.
 * Gestiona la revelación progresiva de los 5 elementos del círculo pequeño
 * y el posterior avance de las 100 frases palabra por palabra.
 */

class ScrollController {
  constructor(options = {}) {
    this.circularDial = options.circularDial;
    this.animationManager = options.animationManager;
    this.phrases = window.romanticPhrases || [];
    this.total = this.phrases.length || 100;

    this.centralStep = 0; // 0 a 3 durante la revelación del círculo pequeño
    this.isPhase6Active = false;
    this.isPhrasesPhaseActive = false;
    this.isAutoPlayingAll = false; // Una vez hecho el scroll, se elimina el scroll y reproduce por defecto
    this.isTransitioning = false;
    this.isThrottled = false;
    this.throttleTime = 100; // ms entre pasos rápidos

    this.init();
  }

  init() {
    this.setupWheelListener();
    this.setupTouchListener();
    this.setupKeyboardListener();
    this.setupDragListener();
    this.setupUIControls();
  }

  /**
   * Se activa cuando la Fase 5 (cierre del círculo central) termina
   */
  activatePhase6() {
    this.isPhase6Active = true;
    this.centralStep = 0;
  }

  // 1. Navegación por rueda del mouse
  setupWheelListener() {
    window.addEventListener('wheel', (e) => {
      if (this.isThrottled) return;

      if (e.deltaY > 15 || e.deltaX > 15) {
        this.handleForward();
        this.throttle();
      } else if (e.deltaY < -15 || e.deltaX < -15) {
        this.handleBackward();
        this.throttle();
      }
    }, { passive: true });
  }

  throttle() {
    this.isThrottled = true;
    setTimeout(() => {
      this.isThrottled = false;
    }, this.throttleTime);
  }

  handleForward() {
    if (this.isTransitioning) return;

    // Si el usuario hace scroll durante la animación inicial (Fases 1-5), acelerar al final de la introducción
    if (!this.isPhase6Active && !this.isPhrasesPhaseActive && this.animationManager && this.animationManager.masterTL && this.animationManager.masterTL.isActive()) {
      this.animationManager.masterTL.progress(1);
      return;
    }

    // Si estamos en la Fase 6 (la información inicial del círculo central ya está 100% visible):
    // El scroll inicia inmediatamente el efecto de las 100 maneras
    if (this.isPhase6Active) {
      this.isPhase6Active = false;
      this.isTransitioning = true;
      this.isAutoPlayingAll = true;

      // Eliminar y ocultar la guía inferior de scroll
      gsap.to('.bottom-scroll-guide', {
        opacity: 0,
        y: 25,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => {
          const guide = document.querySelector('.bottom-scroll-guide');
          if (guide) guide.style.display = 'none';
        }
      });

      if (this.animationManager) {
        // 1. Borrar suavemente el contenido inicial con animación
        this.animationManager.clearInitialCentralContentWithAnimation(() => {
          // 2. Aparece la primera frase de las 100 en el centro con su rayo y contador
          const firstPhrase = this.phrases[0] || { id: 1, text: "Cada latido me recuerda que te necesito aquí conmigo ahora mismo." };
          this.animationManager.transitionToSecondPartDisplay(firstPhrase, () => {
            this.isPhrasesPhaseActive = true;
            this.isTransitioning = false;
            // 3. Muestra por defecto las 100 maneras con la misma animación
            if (this.circularDial) {
              this.circularDial.startSequentialExperience(1);
            }
          });
        });
      } else {
        this.isPhrasesPhaseActive = true;
        this.isTransitioning = false;
        if (this.circularDial) {
          this.circularDial.startSequentialExperience(1);
        }
      }
      return;
    }

    // Si ya estamos en la fase de frases: permitir avanzar libremente frase por frase
    if (this.isPhrasesPhaseActive && this.circularDial) {
      if (this.circularDial.sequenceActive) {
        this.circularDial.stopSequence();
      }
      const nextIdx = this.circularDial.getActiveIndex() + 1;
      if (nextIdx <= this.total) {
        this.circularDial.goToIndex(nextIdx);
      } else {
        if (this.animationManager) {
          this.animationManager.showClimaxScene();
        }
      }
    }
  }

  handleBackward() {
    if (this.isTransitioning) return;

    // Si estamos en las frases, permitir retroceder limpiamente
    if (this.isPhrasesPhaseActive && this.circularDial) {
      if (this.circularDial.sequenceActive) {
        this.circularDial.stopSequence();
      }
      const prevIdx = this.circularDial.getActiveIndex() - 1;
      if (prevIdx >= 1) {
        this.circularDial.goToIndex(prevIdx);
      }
    }
  }

  // 2. Navegación táctil fluida (Android, iPhone, iPad)
  setupTouchListener() {
    let touchStartY = 0;
    let touchStartX = 0;

    window.addEventListener('touchstart', (e) => {
      if (!e.touches || !e.touches[0]) return;
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isThrottled || this.isTransitioning) return;
      if (!e.touches || !e.touches[0]) return;

      const touchEndY = e.touches[0].clientY;
      const touchEndX = e.touches[0].clientX;
      const deltaY = touchStartY - touchEndY;
      const deltaX = touchStartX - touchEndX;

      // Umbral táctil calibrado para respuesta inmediata sin deslices involuntarios
      if (Math.abs(deltaY) > 18 || Math.abs(deltaX) > 18) {
        if (deltaY > 0 || deltaX > 0) {
          this.handleForward();
        } else {
          this.handleBackward();
        }
        touchStartY = touchEndY;
        touchStartX = touchEndX;
        this.throttle();
      }
    }, { passive: true });
  }

  // 3. Teclado
  setupKeyboardListener() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        this.handleForward();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        this.handleBackward();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        this.toggleAutoplay();
      }
    });
  }

  // 4. Arrastre (Drag)
  setupDragListener() {
    const stage = document.querySelector('.universe-circle-stage');
    if (!stage) return;

    let isDragging = false;
    let startY = 0;

    stage.addEventListener('mousedown', (e) => {
      isDragging = true;
      startY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging || this.isThrottled) return;
      const dy = startY - e.clientY;
      if (Math.abs(dy) > 25) {
        if (dy > 0) {
          this.handleForward();
        } else {
          this.handleBackward();
        }
        startY = e.clientY;
        this.throttle();
      }
    }, { passive: true });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  // 5. Controles UI
  setupUIControls() {
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnPlay = document.getElementById('btn-autoplay');
    const btnRestart = document.getElementById('btn-restart');
    const bottomGuide = document.querySelector('.bottom-scroll-guide');

    if (bottomGuide) {
      bottomGuide.addEventListener('click', () => {
        if (this.isPhase6Active) {
          this.handleForward();
        }
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => this.handleForward());
    }
    if (btnPrev) {
      btnPrev.addEventListener('click', () => this.handleBackward());
    }
    if (btnPlay) {
      btnPlay.addEventListener('click', () => this.toggleAutoplay());
    }
    if (btnRestart) {
      btnRestart.addEventListener('click', () => this.restart());
    }
  }

  toggleAutoplay() {
    if (this.isTransitioning) return;

    // Si aún está en la Fase 6 (la información central ya está visible), iniciar frases de inmediato y continuar autoplay
    if (this.isPhase6Active) {
      this.handleForward();
      return;
    }

    if (this.circularDial) {
      this.circularDial.toggleSequence();
    }
  }

  restart() {
    this.isTransitioning = false;
    this.isAutoPlayingAll = false;
    if (this.circularDial) {
      this.circularDial.resetToBlank();
    }
    const guide = document.querySelector('.bottom-scroll-guide');
    if (guide) {
      guide.style.display = '';
      gsap.set(guide, { opacity: 0, y: 15 });
    }
    if (this.animationManager) {
      this.animationManager.hideClimaxScene();
      this.isPhase6Active = false;
      this.isPhrasesPhaseActive = false;
      this.centralStep = 0;
      this.animationManager.startMasterSequence(() => {
        this.activatePhase6();
      });
    }
  }
}

// Exportar globalmente
window.ScrollController = ScrollController;
