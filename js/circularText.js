/**
 * circularText.js
 * Gestiona el círculo exterior con las 100 frases empezando a las 3 en punto (0°).
 * - Sin enumeración (1., 2., etc.) en el círculo exterior, manteniendo el texto limpio.
 * - Pegado directamente al borde del círculo pequeño central (sin espacio excesivo).
 * - Inicialmente en blanco (completamente vacío e invisible).
 * - NO se dibuja ningún círculo al lado durante la escritura de las frases.
 * - AL TERMINAR las 100 frases: Se dispara el efecto circular que engloba el segundo círculo de forma hermosa.
 */

class CircularDial {
  constructor(options = {}) {
    this.container = document.getElementById(options.containerId || 'orbital-phrases-track');
    this.stage = document.querySelector('.universe-circle-stage');
    this.animationManager = options.animationManager || null;

    // Obtener las 100 frases de forma segura
    this.phrases = (typeof window !== 'undefined' && window.romanticPhrases) ||
      (typeof romanticPhrases !== 'undefined' ? romanticPhrases : []) || [];

    this.currentIndex = 1;
    this.total = this.phrases.length || 100;
    this.radius = 146;
    this.items = [];
    this.isTyping = false;
    this.sequenceActive = false;
    this.sequenceTimer = null;
    this.onSelect = options.onSelect || null;
    this.activeRayEl = null;

    this.init();
  }

  init() {
    if (!this.container) return;
    this.container.innerHTML = '';

    if (!this.phrases || this.phrases.length === 0) {
      if (typeof window !== 'undefined' && window.romanticPhrases) {
        this.phrases = window.romanticPhrases;
        this.total = this.phrases.length;
      } else {
        setTimeout(() => this.init(), 60);
        return;
      }
    }

    this.calculateRadius();

    const fragment = document.createDocumentFragment();

    // Las 100 frases se ubican comenzando de la mitad a la derecha a las 12 en punto (-90°)
    this.phrases.forEach((phrase, i) => {
      const index = i + 1;
      // -90° = 12 en punto (mitad superior). Sentido horario hacia la derecha (+3.6° por frase)
      const angleDeg = -90 + (i / this.total) * 360;

      const item = document.createElement('div');
      item.className = 'phrase-orbit-item';
      item.dataset.index = index;
      item.dataset.angle = angleDeg;

      // SIN ENUMERACIÓN: Únicamente el punto brillante y el título de la frase
      item.innerHTML = `
        <span class="orbit-glow-bullet"></span>
        <span class="orbit-title" id="orbit-title-${index}"></span>
      `;

      // Posicionamiento radial pegado al círculo central
      this.positionItem(item, angleDeg, this.radius);

      // Estado inicial: 100% en blanco e invisible
      item.style.opacity = '0';
      item.style.visibility = 'hidden';

      // Eventos interactivos: Clic y hover
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this.stopSequence();
        if (typeof this.onSelect === 'function') {
          this.onSelect(index);
        } else {
          this.goToIndex(index);
        }
      });

      item.addEventListener('mouseenter', () => {
        if (!this.isTyping && this.animationManager) {
          this.animationManager.updateCentralQuote(phrase);
        }
      });

      fragment.appendChild(item);
      this.items.push(item);
    });

    this.container.appendChild(fragment);

    // Reajuste reactivo suave en redimensionamiento de pantalla (Android, iPhone, tablet, desktop)
    if (!this.resizeListenerAttached) {
      this.resizeListenerAttached = true;
      let resizeFrame = null;
      window.addEventListener('resize', () => {
        if (resizeFrame) cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
          this.calculateRadius();
          this.repositionAll();
        });
      });
    }
  }

  /**
   * Calcula el radio para que las frases estén pegadas al contorno del círculo central
   * y calcula la distancia máxima para que los textos queden 100% dentro del círculo grande,
   * aplicando puntos suspensivos (...) si sobrepasan la distancia en cualquier pantalla.
   */
  calculateRadius() {
    const sanctuary = document.querySelector('.center-sanctuary-circle');
    const stage = this.stage || document.querySelector('.universe-circle-stage');
    const stageWidth = stage && stage.offsetWidth > 0 ? stage.offsetWidth : 700;

    if (sanctuary && sanctuary.offsetWidth > 0) {
      const sanctuaryRadius = sanctuary.offsetWidth / 2;
      this.sanctuaryRadius = Math.round(sanctuaryRadius);
      // Holgura ajustada para que las frases nazcan pegadas al círculo central sin solaparse
      const gap = stageWidth < 380 ? 3 : (stageWidth < 768 ? 5 : 8);
      this.radius = Math.round(sanctuaryRadius + gap);
    } else {
      this.sanctuaryRadius = Math.round(stageWidth * 0.18);
      this.radius = Math.round(this.sanctuaryRadius + 6);
    }

    // Radio efectivo en píxeles del círculo exterior dentro del stage (SVG width: 100%, viewBox 700x700, R=345):
    const outerPixelRadius = (stageWidth / 2) * (345 / 350);

    // Margen de seguridad calibrado para que los puntos suspensivos jamás toquen el borde exterior
    const safetyMargin = stageWidth < 380 ? 4 : (stageWidth < 768 ? 6 : 10);
    // Espacio máximo disponible para el texto (descontando viñeta y espaciado ~8px)
    const maxTextWidth = Math.max(38, Math.floor(outerPixelRadius - this.radius - safetyMargin - 8));
    this.maxTextWidth = maxTextWidth;

    // Asignar variable CSS tanto al contenedor como al documento para reactividad inmediata
    if (this.container) {
      this.container.style.setProperty('--orbit-text-max-width', `${maxTextWidth}px`);
    }
    document.documentElement.style.setProperty('--orbit-text-max-width', `${maxTextWidth}px`);
  }

  positionItem(item, angleDeg, currentRadius) {
    // -90° queda en la mitad superior (12 en punto). Al rotar angleDeg y trasladar currentRadius en X:
    // El texto irradia hacia afuera a lo largo de su eje radial hacia la derecha y alrededor
    item.style.transform = `rotate(${angleDeg}deg) translate(${currentRadius}px, -50%)`;
  }

  repositionAll() {
    this.items.forEach((item, i) => {
      const angleDeg = -90 + (i / this.total) * 360;
      this.positionItem(item, angleDeg, this.radius);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Efecto de escritura palabra por palabra con teclado y cursor (SIN ENUMERACIÓN)
   */
  async typeWordByWord(index, phrase, currentSeqId) {
    const item = this.items[index - 1];
    const titleEl = document.getElementById(`orbit-title-${index}`);

    if (!item || !titleEl) return;

    // Hacer visible la frase y marcar como activa/escribiendo
    item.style.visibility = 'visible';
    item.style.opacity = '1';
    item.classList.remove('written');
    item.classList.add('typing-now');

    // Dividir en palabras (SIN número en el texto)
    const words = phrase.short.trim().split(/\s+/);
    titleEl.textContent = '';
    const textNode = document.createTextNode('');
    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    titleEl.appendChild(textNode);
    titleEl.appendChild(cursor);
    let typedText = '';

    for (let w = 0; w < words.length; w++) {
      if (!this.sequenceActive || (currentSeqId && this.sequenceId !== currentSeqId)) break;

      const word = words[w];
      // Escribir cada letra de la palabra rápidamente con tecla
      for (let c = 0; c < word.length; c++) {
        if (!this.sequenceActive || (currentSeqId && this.sequenceId !== currentSeqId)) break;
        typedText += word[c];
        textNode.nodeValue = typedText;

        await this.sleep(15);
      }

      // Espacio entre palabras con cadencia natural
      if (w < words.length - 1) {
        typedText += ' ';
        textNode.nodeValue = typedText;
        await this.sleep(40);
      }
    }

    if (!this.sequenceActive || (currentSeqId && this.sequenceId !== currentSeqId)) {
      item.classList.remove('typing-now');
      cursor.remove();
      return;
    }

    // AL TERMINAR: Retirar el cursor y fijar texto con puntos suspensivos si sobrepasa el círculo
    cursor.remove();
    titleEl.textContent = phrase.short;
    titleEl.setAttribute('title', phrase.short);
    item.classList.remove('typing-now');
    item.classList.add('written');
    item.style.opacity = '0.88';
  }

  /**
   * Efecto de rayo radial eliminado por completo a petición del usuario.
   * La frase se escribe directamente con su animación tipográfica sin rayos de luz invasivos.
   */
  async shootRayToPhrase(angleDeg) {
    this.eraseActiveRay();
    return Promise.resolve();
  }

  /**
   * Limpia y elimina cualquier rayo o línea residual del DOM de forma inmediata.
   */
  eraseActiveRay() {
    if (this.container) {
      const residualRays = this.container.querySelectorAll('.radial-beam-ray');
      residualRays.forEach(ray => ray.remove());
    }
    this.activeRayEl = null;
  }

  /**
   * SECUENCIA PRINCIPAL:
   * Aparecen una por una tras el scroll de la información central.
   * 1. ANTES de escribir: Sale el efecto de línea desde el centro del círculo pequeño hacia la posición de la frase.
   * 2. DESPUÉS: Empieza la escritura de la frase y se muestra el segundo mensaje en el centro circular.
   * 3. AL TERMINAR: Salta a la siguiente frase, la línea anterior se borra y sale otra igual para la siguiente.
   */
  async startSequentialExperience(startIndex = 1, onFinishedAll) {
    this.sequenceId = (this.sequenceId || 0) + 1;
    const currentSeqId = this.sequenceId;

    // Si ya existe un ciclo en ejecución, detenerlo limpiamente antes de reiniciar
    if (this.isLooping) {
      this.sequenceActive = false;
      this.eraseActiveRay();
      await this.sleep(40);
      if (this.sequenceId !== currentSeqId) return;
    }

    this.sequenceActive = true;
    this.isLooping = true;
    this.currentIndex = startIndex;

    // Asegurar que el radio y max-width estén calculados con precisión para la pantalla actual
    this.calculateRadius();
    this.repositionAll();

    try {
      for (let idx = startIndex; idx <= this.total; idx++) {
        if (!this.sequenceActive || this.sequenceId !== currentSeqId) break;

        this.currentIndex = idx;
        this.isTyping = true;
        const phrase = this.phrases[idx - 1];

        // Ángulo de la frase: -90° (12 en punto) + 3.6° * (idx - 1)
        const angleDeg = -90 + ((idx - 1) / this.total) * 360;

        // PASO 1: ANTES DEL EFECTO DE ESCRIBIR:
        // Sale el efecto de línea desde el contorno del círculo pequeño hacia la posición de la frase
        await this.shootRayToPhrase(angleDeg);

        if (!this.sequenceActive || this.sequenceId !== currentSeqId) break;

        // PASO 2: DESPUÉS EMPIEZA LA ESCRITURA Y MUESTRA EL SEGUNDO MENSAJE EN EL CENTRO
        if (this.animationManager && phrase) {
          this.animationManager.updateCentralQuote(phrase);
        }

        // 2. Escribir palabra por palabra en su posición del círculo exterior
        await this.typeWordByWord(idx, phrase, currentSeqId);

        this.isTyping = false;

        // PASO 3: AL TERMINAR DE ESCRIBIR ESA LÍNEA:
        // Salta a la siguiente línea: la línea anterior se borra y saldrá otra igual para la siguiente
        this.eraseActiveRay();

        // Pausa breve antes de saltar a la siguiente frase
        if (this.sequenceActive && this.sequenceId === currentSeqId && idx < this.total) {
          await this.sleep(40);
        }
      }

      // Asegurar que no quede ningún rayo huérfano al terminar
      this.eraseActiveRay();

      // AL TERMINAR DE MOSTRAR LAS 100 MANERAS:
      // Efecto circular hermoso que engloba el segundo círculo y clímax
      if (this.sequenceActive && this.sequenceId === currentSeqId && this.currentIndex >= this.total) {
        this.items.forEach(it => {
          it.classList.add('written');
          it.style.visibility = 'visible';
          it.style.opacity = '0.88';
        });

        if (this.animationManager) {
          this.animationManager.playEnclosingOuterCircleEffect(() => {
            if (typeof onFinishedAll === 'function') onFinishedAll();
          });
        }
      }
    } finally {
      if (this.sequenceId === currentSeqId) {
        this.isLooping = false;
        this.isTyping = false;
      }
    }
  }

  stopSequence() {
    this.sequenceId = (this.sequenceId || 0) + 1;
    this.sequenceActive = false;
    this.isLooping = false;
    this.eraseActiveRay();
    const btnPlay = document.getElementById('btn-autoplay');
    if (btnPlay) {
      btnPlay.innerHTML = '<span class="icon">▶</span> Modo Automático';
      btnPlay.classList.remove('active');
    }
  }

  toggleSequence() {
    if (this.sequenceActive) {
      this.stopSequence();
    } else {
      const btnPlay = document.getElementById('btn-autoplay');
      if (btnPlay) {
        btnPlay.innerHTML = '<span class="icon">⏸</span> Pausar';
        btnPlay.classList.add('active');
      }
      this.startSequentialExperience(this.currentIndex);
    }
  }

  /**
   * Navegación o avance directo por scroll hacia un índice específico
   * Garantiza que todas las frases anteriores se queden ahí visibles (sin números)
   */
  goToIndex(targetIndex) {
    if (targetIndex < 1) targetIndex = 1;
    if (targetIndex > this.total) targetIndex = this.total;

    // Pausar secuencia automática e invalidar tareas pendientes para evitar colisiones
    this.sequenceId = (this.sequenceId || 0) + 1;
    this.sequenceActive = false;
    this.isLooping = false;
    const btnPlay = document.getElementById('btn-autoplay');
    if (btnPlay) {
      btnPlay.innerHTML = '<span class="icon">▶</span> Modo Automático';
      btnPlay.classList.remove('active');
    }

    const prevIndex = this.currentIndex;
    this.currentIndex = targetIndex;

    // Desactivar clase active del elemento previo
    if (this.items[prevIndex - 1]) {
      this.items[prevIndex - 1].classList.remove('active');
      this.items[prevIndex - 1].style.opacity = '0.88';
    }

    // Revelar y dejar fijas todas las frases anteriores hasta targetIndex
    for (let i = 1; i <= targetIndex; i++) {
      const it = this.items[i - 1];
      const ph = this.phrases[i - 1];
      const titleEl = document.getElementById(`orbit-title-${i}`);

      if (it && ph) {
        it.style.visibility = 'visible';
        it.classList.remove('typing-now');

        if (!it.classList.contains('written')) {
          if (titleEl) {
            titleEl.textContent = ph.short;
            titleEl.setAttribute('title', ph.short);
          }
          it.classList.add('written');
        }

        if (i === targetIndex) {
          it.style.opacity = '1';
          it.classList.add('active');
          if (titleEl) titleEl.setAttribute('title', ph.short);
        } else {
          it.style.opacity = '0.88';
          it.classList.remove('active');
        }
      }
    }

    // Disparar rayo guía a la frase seleccionada
    const targetAngle = -90 + ((targetIndex - 1) / this.total) * 360;
    this.shootRayToPhrase(targetAngle);

    // Actualizar mensaje central
    const activePhrase = this.phrases[targetIndex - 1];
    if (this.animationManager && activePhrase) {
      this.animationManager.updateCentralQuote(activePhrase);
    }

    // Si llega a la frase 100, disparar el efecto circular que engloba el segundo círculo
    if (targetIndex === this.total && this.animationManager) {
      this.animationManager.playEnclosingOuterCircleEffect();
    }
  }

  /**
   * Reiniciar a estado completamente en blanco (al principio sea blanco)
   */
  resetToBlank() {
    this.stopSequence();
    this.eraseActiveRay();
    this.currentIndex = 1;
    this.isTyping = false;
    this.isLooping = false;

    this.items.forEach((item, i) => {
      item.classList.remove('written', 'typing-now', 'active', 'encapsulated');
      item.style.opacity = '0';
      item.style.visibility = 'hidden';

      const titleEl = document.getElementById(`orbit-title-${i + 1}`);
      if (titleEl) {
        titleEl.textContent = '';
        titleEl.style.animationDelay = '';
      }
      const bulletEl = item.querySelector('.orbit-glow-bullet');
      if (bulletEl) {
        bulletEl.style.animationDelay = '';
      }
    });

    // Restaurar el corazón, el título I MISS YOU, el subtítulo y vaciar textos en el santuario central
    const heartEl = document.querySelector('.central-item-heart');
    if (heartEl) {
      heartEl.classList.remove('hidden-during-phrases');
    }
    const titleEl = document.querySelector('.central-main-title');
    if (titleEl) {
      titleEl.classList.remove('hidden-during-phrases');
    }
    const subheadEl = document.querySelector('.central-item-subhead');
    if (subheadEl) {
      subheadEl.classList.remove('hidden-during-phrases');
    }
    const phraseEl = document.querySelector('.central-phrase-quote') || document.querySelector('.central-poem-quote');
    if (phraseEl) {
      phraseEl.innerHTML = '';
    }
    const counterEl = document.querySelector('.central-quote-counter');
    if (counterEl) {
      counterEl.textContent = '01 / 100';
    }

    const outerPath = document.getElementById('outer-circle-draw-path');
    const outerHalo = document.getElementById('outer-circle-halo');
    const outerPoint = document.getElementById('outer-circle-draw-point');
    const outerFlash = document.getElementById('outer-circle-flash');
    const outerBackdrop = document.getElementById('outer-circle-disc-backdrop');
    const outerInnerRing = document.getElementById('outer-circle-inner-ring');
    const outerCorona = document.getElementById('outer-circle-corona');
    const outerSparklesGroup = document.getElementById('outer-circle-sparkles-group');

    document.body.classList.remove('encapsulated-active');

    if (outerPath) {
      outerPath.style.opacity = '0';
      outerPath.style.display = 'none';
      outerPath.style.strokeDashoffset = '2180';
    }
    if (outerHalo) {
      outerHalo.style.opacity = '0';
      outerHalo.style.display = 'none';
      outerHalo.classList.remove('active');
    }
    if (outerPoint) {
      outerPoint.style.opacity = '0';
      outerPoint.style.display = 'none';
    }
    if (outerFlash) {
      outerFlash.style.opacity = '0';
      outerFlash.style.display = 'none';
    }
    if (outerBackdrop) {
      outerBackdrop.style.opacity = '0';
      outerBackdrop.style.display = 'none';
    }
    if (outerInnerRing) {
      outerInnerRing.style.opacity = '0';
      outerInnerRing.style.display = 'none';
    }
    if (outerCorona) {
      outerCorona.style.opacity = '0';
      outerCorona.style.display = 'none';
    }
    if (outerSparklesGroup) {
      outerSparklesGroup.style.opacity = '0';
      outerSparklesGroup.style.display = 'none';
      outerSparklesGroup.innerHTML = '';
    }
  }

  getActiveIndex() {
    return this.currentIndex;
  }
}

// Exportar globalmente
window.CircularDial = CircularDial;
