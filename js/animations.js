/**
 * animations.js
 * Motor de animaciones cinematográficas con GSAP y sistema de partículas en Canvas.
 * Secuencia estricta, corazones 3D cristalinos y efecto circular que engloba el segundo círculo al terminar.
 */

class CosmicParticles {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.stars = [];
    this.ambientHearts = [];
    this.explosionHearts = [];
    this.rainHearts = [];
    this.heartsRainActive = false;
    this.mouseX = window.innerWidth / 2;
    this.mouseY = window.innerHeight / 2;

    this.stageEl = null;
    this.frameCount = 0;
    this.stageCenterX = this.canvas.width * 0.5;
    this.stageCenterY = this.canvas.height * 0.5;
    this.stageRadiusSquared = 380 * 380;

    this.createHeartSprite();
    this.resize();
    this.initElements();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.updateStageBounds();
  }

  updateStageBounds() {
    const isMobile = this.width <= 860;
    let circleCenterX = isMobile ? this.width * 0.5 : this.width * 0.68;
    let circleCenterY = isMobile ? this.height * 0.68 : this.height * 0.5;
    let stageRadius = 380;
    if (!this.stageEl) {
      this.stageEl = document.querySelector('.universe-circle-stage');
    }
    if (this.stageEl) {
      const rect = this.stageEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        circleCenterX = rect.left + rect.width * 0.5;
        circleCenterY = rect.top + rect.height * 0.5;
        stageRadius = Math.max(rect.width, rect.height) * 0.52;
      }
    }
    this.stageCenterX = circleCenterX;
    this.stageCenterY = circleCenterY;
    this.stageRadiusSquared = stageRadius * stageRadius;
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
  }

  initElements() {
    // 1. Polvo cósmico y partículas luminosas
    this.particles = [];
    const particleCount = Math.min(Math.floor(this.width * 0.07), 100);
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 2 + 0.8,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        alpha: Math.random() * 0.7 + 0.3,
        color: Math.random() > 0.4 ? '#ff2a7a' : (Math.random() > 0.5 ? '#9d4edd' : '#ffffff')
      });
    }

    // 2. Estrellas brillantes con parpadeo suave
    this.stars = [];
    const starCount = 50;
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2.2 + 0.8,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.03 + 0.008
      });
    }

    // 3. Corazones flotantes de fondo
    this.ambientHearts = [];
    const heartCount = 14;
    for (let i = 0; i < heartCount; i++) {
      this.ambientHearts.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 16 + 12,
        z: Math.random() * 0.5 + 0.5,
        vy: -(Math.random() * 0.6 + 0.25),
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.025 + 0.01,
        rotation: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.45 + 0.25
      });
    }

  }

  /**
   * Pre-renderizado en sprite offscreen del corazón de cristal 3D para máximo rendimiento a 60 FPS sin asignaciones de memoria en bucle
   */
  createHeartSprite() {
    this.heartSprite = document.createElement('canvas');
    this.heartSprite.width = 128;
    this.heartSprite.height = 128;
    const sctx = this.heartSprite.getContext('2d');
    sctx.translate(64, 52);
    sctx.scale(1.8, 1.8);

    // Contorno del corazón
    sctx.beginPath();
    sctx.moveTo(0, -10);
    sctx.bezierCurveTo(8, -25, 30, -18, 28, 6);
    sctx.bezierCurveTo(26, 20, 10, 30, 0, 40);
    sctx.bezierCurveTo(-10, 30, -26, 20, -28, 6);
    sctx.bezierCurveTo(-30, -18, -8, -25, 0, -10);
    sctx.closePath();

    // Relleno de degradado de cristal rosa y rojo
    const grad = sctx.createRadialGradient(-6, -6, 2, 0, 10, 36);
    grad.addColorStop(0, 'rgba(255, 140, 190, 1)');
    grad.addColorStop(0.3, 'rgba(255, 42, 122, 0.95)');
    grad.addColorStop(0.72, 'rgba(180, 10, 70, 0.9)');
    grad.addColorStop(1, 'rgba(80, 0, 30, 0.85)');
    sctx.fillStyle = grad;
    sctx.fill();

    // Borde brillante de cristal
    sctx.strokeStyle = 'rgba(255, 117, 140, 0.55)';
    sctx.lineWidth = 1.5;
    sctx.stroke();

    // Reflejo especular blanco superior izquierdo
    sctx.beginPath();
    sctx.ellipse(-12, -6, 6, 11, -Math.PI / 5, 0, Math.PI * 2);
    sctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    sctx.fill();

    // Reflejo especular secundario
    sctx.beginPath();
    sctx.ellipse(13, -7, 4, 7, Math.PI / 5, 0, Math.PI * 2);
    sctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    sctx.fill();

    // Destello inferior
    sctx.beginPath();
    sctx.ellipse(0, 30, 7, 3, 0, 0, Math.PI * 2);
    sctx.fillStyle = 'rgba(255, 180, 220, 0.35)';
    sctx.fill();
  }

  /**
   * Renderizado acelerado por GPU de corazón de cristal 3D mediante sprite precargado
   */
  drawRealisticCrystalHeart(ctx, x, y, size, z, alpha, rotation = 0) {
    if (!this.heartSprite || alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    if (rotation) ctx.rotate(rotation);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    const s = size / 30;
    ctx.drawImage(this.heartSprite, -32 * s, -32 * s, 64 * s, 64 * s);
    ctx.restore();
  }

  triggerHeartsExplosion(count = 28) {
    const safeCount = Math.min(count, 30);
    for (let i = 0; i < safeCount; i++) {
      if (this.explosionHearts.length >= 35) break;
      const z = Math.random() * 0.9 + 0.4;
      const size = (Math.random() * 24 + 16) * z;
      this.explosionHearts.push({
        x: Math.random() * this.width,
        y: this.height * (0.3 + Math.random() * 0.7),
        size: size,
        z: z,
        vy: -(Math.random() * 1.5 + 0.9) * z,
        vx: (Math.random() - 0.5) * 0.6,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.03 + 0.015,
        rotation: (Math.random() - 0.5) * 0.4,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        alpha: 0,
        targetAlpha: Math.min(1, Math.random() * 0.4 + 0.6),
        fadeInSpeed: Math.random() * 0.04 + 0.02,
        life: 0,
        maxLife: Math.floor(Math.random() * 90 + 110)
      });
    }
  }

  triggerHeartsRain() {
    this.heartsRainActive = true;
    this.triggerHeartsExplosion(26);
  }

  stopHeartsRain() {
    this.heartsRainActive = false;
    this.explosionHearts = [];
    this.rainHearts = [];
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const circleCenterX = this.stageCenterX;
    const circleCenterY = this.stageCenterY;
    const stageRadiusSquared = this.stageRadiusSquared;

    // 1. Estrellas cósmicas de fondo (excluyendo el contenedor del círculo grande)
    for (let star of this.stars) {
      const dx = star.x - circleCenterX;
      const dy = star.y - circleCenterY;
      if (dx * dx + dy * dy < stageRadiusSquared) continue; // Cero luces en el contenedor del círculo grande

      star.twinkle += star.speed;
      const alpha = 0.3 + Math.sin(star.twinkle) * 0.45;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, alpha)})`;
      this.ctx.fill();
    }

    // 2. Partículas cósmicas (excluyendo el contenedor del círculo grande)
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      const dx = p.x - circleCenterX;
      const dy = p.y - circleCenterY;
      if (dx * dx + dy * dy < stageRadiusSquared) continue; // Cero luces en el contenedor del círculo grande

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1.0;

    // 3. Corazones flotantes de fondo
    for (let h of this.ambientHearts) {
      h.y += h.vy;
      h.wobble += h.wobbleSpeed;
      const curX = h.x + Math.sin(h.wobble) * 22;

      if (h.y < -60) {
        h.y = this.height + 40;
        h.x = Math.random() * this.width;
      }
      this.drawRealisticCrystalHeart(this.ctx, curX, h.y, h.size, h.z, h.alpha, h.rotation);
    }

    // 4. Corazones de explosión / lluvia
    for (let i = this.explosionHearts.length - 1; i >= 0; i--) {
      const h = this.explosionHearts[i];
      h.life++;

      if (h.alpha < h.targetAlpha) {
        h.alpha = Math.min(h.targetAlpha, h.alpha + h.fadeInSpeed);
      }

      if (h.life > h.maxLife - 40) {
        h.alpha = Math.max(0, h.alpha - 0.025);
      }

      h.y += h.vy;
      h.x += h.vx;
      h.wobble += h.wobbleSpeed;
      h.rotation += h.rotSpeed;
      const curX = h.x + Math.sin(h.wobble) * 16;

      if (h.alpha > 0.01 && h.y > -80) {
        this.drawRealisticCrystalHeart(this.ctx, curX, h.y, h.size, h.z, h.alpha, h.rotation);
      } else {
        this.explosionHearts.splice(i, 1);
      }
    }

    // Generador suave de lluvia sin saturación
    if (this.heartsRainActive && this.explosionHearts.length < 28 && Math.random() < 0.1) {
      const z = Math.random() * 0.9 + 0.35;
      const size = (Math.random() * 24 + 16) * z;
      this.explosionHearts.push({
        x: Math.random() * this.width,
        y: this.height + 20,
        size: size,
        z: z,
        vy: -(Math.random() * 1.6 + 0.8) * z,
        vx: (Math.random() - 0.5) * 0.5,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.03 + 0.01,
        rotation: (Math.random() - 0.5) * 0.4,
        rotSpeed: (Math.random() - 0.5) * 0.015,
        alpha: 0,
        targetAlpha: Math.min(1, Math.random() * 0.4 + 0.6),
        fadeInSpeed: 0.03,
        life: 0,
        maxLife: Math.floor(Math.random() * 90 + 110)
      });
    }

    requestAnimationFrame(this.animate);
  }
}

/**
 * Gestor Maestro de Animaciones
 */
class AnimationManager {
  constructor() {
    this.particles = new CosmicParticles('ambient-canvas');
    this.currentPhase = 0;
    this.initHeartbeat();
    this.revealedItemsCount = 0;
  }

  initHeartbeat() {
    const heart = document.querySelector('.center-beating-heart');
    if (!heart || !window.gsap) return;

    gsap.timeline({ repeat: -1 })
      .to(heart, { scale: 1.25, duration: 0.15, ease: 'power2.out' })
      .to(heart, { scale: 1.0, duration: 0.12, ease: 'power2.in' })
      .to(heart, { scale: 1.15, duration: 0.14, ease: 'power2.out' })
      .to(heart, { scale: 1.0, duration: 0.45, ease: 'power3.out' })
      .to({}, { duration: 0.6 });
  }

  /**
   * SECUENCIA MAESTRA: FASES 1 a 6
   * Dibuja corazón izquierdo, destella, explotan corazones 3D,
   * y materializa ÚNICAMENTE el círculo central pequeño (.center-sanctuary-circle).
   * CERO círculos duplicados o trazados SVG extra alrededor del centro.
   */
  startMasterSequence(onPhase6Ready) {
    if (!window.gsap) return;

    const heartPath = document.getElementById('neonHeartPath');
    const heartPathInner = document.getElementById('neonHeartPathInner');
    const heartPoint = document.getElementById('heart-draw-point');
    const heartFlash = document.getElementById('heart-finish-flash');

    const outerPath = document.getElementById('outer-circle-draw-path');
    const outerPoint = document.getElementById('outer-circle-draw-point');
    const outerFlash = document.getElementById('outer-circle-flash');
    const outerHalo = document.getElementById('outer-circle-halo');
    const outerBackdrop = document.getElementById('outer-circle-disc-backdrop');
    const outerInnerRing = document.getElementById('outer-circle-inner-ring');
    const outerCorona = document.getElementById('outer-circle-corona');
    const outerSparklesGroup = document.getElementById('outer-circle-sparkles-group');

    const heartLen = heartPath ? heartPath.getTotalLength() : 1200;
    const outerLen = outerPath ? outerPath.getTotalLength() : 2080;

    // Resetear estados iniciales
    if (heartPath) {
      gsap.set([heartPath, heartPathInner], { strokeDasharray: heartLen, strokeDashoffset: heartLen });
    }
    // El círculo exterior se mantiene 100% oculto hasta que terminen las 100 frases
    if (outerPath) {
      gsap.set(outerPath, { opacity: 0, strokeDasharray: outerLen, strokeDashoffset: outerLen });
    }
    [outerPoint, outerFlash, outerHalo, outerCorona, outerInnerRing, outerSparklesGroup].forEach(el => {
      if (el) {
        el.style.display = 'none';
        gsap.set(el, { opacity: 0 });
      }
    });
    if (outerHalo) outerHalo.classList.remove('active');
    if (outerBackdrop) gsap.set(outerBackdrop, { opacity: 0 });
    if (outerSparklesGroup) outerSparklesGroup.innerHTML = '';
    document.body.classList.remove('encapsulated-active');
    document.querySelectorAll('.phrase-orbit-item').forEach(it => {
      it.classList.remove('encapsulated');
      const t = it.querySelector('.orbit-title');
      if (t) t.style.animationDelay = '';
      const b = it.querySelector('.orbit-glow-bullet');
      if (b) b.style.animationDelay = '';
    });

    gsap.set([heartPoint, heartFlash, outerPoint, outerFlash, outerHalo], { opacity: 0 });
    gsap.set('.romantic-scene-left', { opacity: 0, x: -40 });
    gsap.set('#couple-heart-container', { opacity: 0, scale: 0.94, filter: 'blur(8px)' });
    gsap.set('.foreground-elements-group', { opacity: 0, scale: 0.9, y: 22, filter: 'blur(6px)' });
    gsap.set('.universe-circle-stage', { opacity: 1 });
    gsap.set('.center-sanctuary-circle', {
      opacity: 0,
      scale: 0.85,
      x: 0,
      y: 0,
      xPercent: 0,
      yPercent: 0,
      transformOrigin: '50% 50%',
      filter: 'blur(8px)'
    });

    // Restaurar elementos iniciales del santuario central
    const heartEl = document.querySelector('.central-item-heart');
    if (heartEl) heartEl.classList.remove('hidden-during-phrases');
    const titleEl = document.querySelector('.central-item-title');
    if (titleEl) titleEl.classList.remove('hidden-during-phrases');
    const subhead = document.querySelector('.central-item-subhead');
    if (subhead) subhead.classList.remove('hidden-during-phrases');
    const phraseEl = document.querySelector('.central-phrase-quote') || document.querySelector('.central-poem-quote');
    if (phraseEl) {
      phraseEl.innerHTML = '';
    }
    const counterEl = document.querySelector('.central-quote-counter');
    if (counterEl) {
      counterEl.textContent = '01 / 100';
    }

    gsap.set('.central-item', { opacity: 0, y: 16, filter: 'blur(8px)', scale: 0.95 });
    gsap.set('.bottom-scroll-guide', { opacity: 0, y: 20 });

    if (this.masterTL) {
      this.masterTL.kill();
    }
    this.masterTL = gsap.timeline();
    const masterTL = this.masterTL;

    // FASE 1: DIBUJO DEL CORAZÓN IZQUIERDO
    this.currentPhase = 1;
    masterTL
      .to('.romantic-scene-left', {
        opacity: 1,
        x: 0,
        duration: 1.2,
        ease: 'power3.out'
      })
      .call(() => {
        if (heartPoint && heartPath) {
          const startPt = heartPath.getPointAtLength(0);
          heartPoint.setAttribute('cx', startPt.x);
          heartPoint.setAttribute('cy', startPt.y);
          gsap.set(heartPoint, { opacity: 1 });
        }
      })
      .to({ progress: 0 }, {
        progress: 1,
        duration: 2.2,
        ease: 'power2.inOut',
        onUpdate: function() {
          const prog = this.targets()[0].progress;
          const currentOffset = heartLen * (1 - prog);
          if (heartPath) heartPath.style.strokeDashoffset = currentOffset;
          if (heartPathInner) heartPathInner.style.strokeDashoffset = currentOffset;

          if (heartPoint && heartPath) {
            const pt = heartPath.getPointAtLength(prog * heartLen);
            heartPoint.setAttribute('cx', pt.x);
            heartPoint.setAttribute('cy', pt.y);
          }
        }
      })

      // FASE 2: DESTELLO FINAL DEL CORAZÓN IZQUIERDO Y APARICIÓN DE LA IMAGEN EN SU INTERIOR
      .call(() => {
        this.currentPhase = 2;
        if (heartPoint) gsap.set(heartPoint, { opacity: 0 });
        if (heartFlash && heartPath) {
          const endPt = heartPath.getPointAtLength(heartLen);
          heartFlash.setAttribute('cx', endPt.x);
          heartFlash.setAttribute('cy', endPt.y);
          gsap.fromTo(heartFlash, 
            { opacity: 1, scale: 0.5, transformOrigin: 'center' },
            { opacity: 0, scale: 2.8, duration: 0.45, ease: 'power2.out' }
          );
        }

        // CUBRIR POR COMPLETO EL INTERIOR DEL CORAZÓN FORMADO SIN SALIRSE DEL CONTENEDOR
        gsap.to('#couple-heart-container', {
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.1,
          ease: 'power3.out'
        });

        // APARICIÓN DE LAS FLORES Y EL PELUCHE AMONTONADOS EN EL MEDIO CON EFECTO REALISTA
        gsap.to('.foreground-elements-group', {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 1.25,
          ease: 'back.out(1.15)'
        });
      })

      // FASE 3: EXPLOSIÓN DE CORAZONES REALISTAS
      .call(() => {
        this.currentPhase = 3;
        this.particles.triggerHeartsExplosion(38);
      })
      .to({}, { duration: 0.8 })

      // FASE 4: ENTRADA DEL CÍRCULO CENTRAL ÚNICO CON INFORMACIÓN COMPLETA (SIN NECESIDAD DE SCROLL)
      .call(() => {
        this.currentPhase = 4;
      })
      .to('.center-sanctuary-circle', {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        xPercent: 0,
        yPercent: 0,
        transformOrigin: '50% 50%',
        filter: 'blur(0px)',
        duration: 1.2,
        ease: 'power2.out',
        onComplete: () => {
          const sanctuary = document.querySelector('.center-sanctuary-circle');
          if (sanctuary) {
            sanctuary.style.transform = 'none';
          }
        }
      })
      // Revelación simultánea de toda la información completa del círculo central
      .to(['.central-item-heart', '.central-item-title', '.central-item-subhead'], {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        scale: 1,
        duration: 0.85,
        stagger: 0.12,
        ease: 'power3.out'
      }, '-=0.8')

      // FASE 5: APARICIÓN SUAVE DEL CÍRCULO CENTRAL SIN DESTELLOS INTENSOS
      .call(() => {
        this.currentPhase = 5;
        const sanctuary = document.querySelector('.center-sanctuary-circle');
        if (sanctuary) {
          gsap.fromTo(sanctuary,
            { boxShadow: '0 0 25px rgba(255, 42, 122, 0.7)' },
            { boxShadow: '0 0 15px rgba(255, 42, 122, 0.4)', duration: 0.5, ease: 'power2.out' }
          );
        }
      })
      .to({}, { duration: 0.4 })

      // FASE 6: ENTRADA DE LA INFORMACIÓN CENTRAL MEDIANTE SCROLL
      // (NO se crea ni se muestra ningún otro círculo a su lado)
      .call(() => {
        this.currentPhase = 6;
        gsap.to('.bottom-scroll-guide', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });

        if (typeof onPhase6Ready === 'function') {
          onPhase6Ready();
        }
      });

    return masterTL;
  }

  revealCentralStep(stepIndex) {
    // 3 pasos en el scroll inicial del círculo central (SIN contador): 1. ❤️, 2. I MISS YOU, 3. 100 WAYS TO SAY IT
    const items = [
      document.querySelector('.central-item-heart'),
      document.querySelector('.central-item-title'),
      document.querySelector('.central-item-subhead')
    ];

    if (stepIndex >= 1 && stepIndex <= 3) {
      const el = items[stepIndex - 1];
      if (el) {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          scale: 1,
          duration: 0.45,
          ease: 'power3.out'
        });
      }
      this.revealedItemsCount = Math.max(this.revealedItemsCount, stepIndex);
    }
  }

  hideCentralStep(stepIndex) {
    const items = [
      document.querySelector('.central-item-heart'),
      document.querySelector('.central-item-title'),
      document.querySelector('.central-item-subhead')
    ];

    if (stepIndex >= 1 && stepIndex <= 3) {
      const el = items[stepIndex - 1];
      if (el) {
        gsap.to(el, {
          opacity: 0,
          y: 16,
          filter: 'blur(8px)',
          scale: 0.95,
          duration: 0.35,
          ease: 'power2.in'
        });
      }
      this.revealedItemsCount = Math.min(this.revealedItemsCount, stepIndex - 1);
    }
  }

  revealAllCentralItemsSequentially(onComplete) {
    const tl = gsap.timeline({
      onComplete: () => {
        this.revealedItemsCount = 3;
        if (typeof onComplete === 'function') onComplete();
      }
    });

    const items = [
      document.querySelector('.central-item-heart'),
      document.querySelector('.central-item-title'),
      document.querySelector('.central-item-subhead')
    ];

    items.forEach((item, idx) => {
      if (item) {
        tl.to(item, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          scale: 1,
          duration: 0.4,
          ease: 'back.out(1.2)'
        }, idx === 0 ? 0 : '-=0.15');
      }
    });

    return tl;
  }

  /**
   * Al terminar el scroll central:
   * Borra todo el contenido inicial del scroll central con un efecto de animación suave y cinematográfico.
   */
  clearInitialCentralContentWithAnimation(onComplete) {
    const items = [
      document.querySelector('.central-item-heart'),
      document.querySelector('.central-item-title'),
      document.querySelector('.central-item-subhead')
    ];

    const tl = gsap.timeline({
      onComplete: () => {
        // Borrar / ocultar definitivamente I MISS YOU, 100 WAYS TO SAY IT y el CORAZÓN durante el modo de frases
        const titleEl = document.querySelector('.central-item-title');
        const subhead = document.querySelector('.central-item-subhead');
        const heartEl = document.querySelector('.central-item-heart');
        if (titleEl) titleEl.classList.add('hidden-during-phrases');
        if (subhead) subhead.classList.add('hidden-during-phrases');
        if (heartEl) heartEl.classList.add('hidden-during-phrases');

        if (typeof onComplete === 'function') onComplete();
      }
    });

    items.forEach((item, idx) => {
      if (item) {
        tl.to(item, {
          opacity: 0,
          y: -14,
          filter: 'blur(10px)',
          scale: 0.94,
          duration: 0.45,
          ease: 'power2.in'
        }, idx === 0 ? 0 : '-=0.32');
      }
    });

    return tl;
  }

  /**
   * Transición de entrada para mostrar la segunda parte del mensaje en el centro con el contador
   * (El corazón, I MISS YOU y el subtítulo quedan 100% ocultos)
   */
  transitionToSecondPartDisplay(phrase, onComplete) {
    const titleEl = document.querySelector('.central-item-title');
    const subhead = document.querySelector('.central-item-subhead');
    const heartEl = document.querySelector('.central-item-heart');
    if (titleEl) titleEl.classList.add('hidden-during-phrases');
    if (subhead) subhead.classList.add('hidden-during-phrases');
    if (heartEl) heartEl.classList.add('hidden-during-phrases');

    const phraseEl = document.querySelector('.central-phrase-quote') || document.querySelector('.central-poem-quote');
    const counterEl = document.querySelector('.central-quote-counter');

    const continuationText = phrase ? (phrase.text || phrase.continuation) : "Cada instante lejos de ti se siente como un segundo que no debió existir.";
    const paddedId = phrase ? String(phrase.id).padStart(2, '0') : "01";

    if (phraseEl) {
      phraseEl.innerHTML = `
        <span class="central-phrase-continuation">«${continuationText}»</span>
      `;
    }

    if (counterEl) {
      counterEl.textContent = `${paddedId} / 100`;
    }

    // ÚNICAMENTE se revelan la segunda parte del mensaje y el contador (Sin corazón arriba)
    const itemsToReveal = [phraseEl, counterEl].filter(Boolean);

    gsap.set(itemsToReveal, { opacity: 0, y: 14, filter: 'blur(8px)', scale: 0.96 });

    return gsap.to(itemsToReveal, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      scale: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
      onComplete: () => {
        if (typeof onComplete === 'function') onComplete();
      }
    });
  }

  /**
   * AL TERMINAR DE MOSTRAR LAS 100 MANERAS DE DECIR TE EXTRAÑO:
   * ENCAPSULAMIENTO COMPLETO DEL SEGUNDO CÍRCULO GRANDE
   * - Despliegue del fondo cósmico aterciopelado de alto contraste para que los textos blancos jamás se pierdan.
   * - El cometa de luz recorre los 360° desde las 12 en punto trazando el contorno exterior neón.
   * - Gran destello expansivo en las 12 en punto al sellar el círculo.
   * - Halo radiante respirable y corona de luz.
   * - Destellos estelares (estrellas de diamantes de 8 puntas) en el borde perimetral.
   * - Animación de destellos y ondas diamantadas continuas a lo largo de las 100 frases.
   * - Lluvia masiva de corazones 3D cristalinos.
   */
  playEnclosingOuterCircleEffect(onComplete) {
    this.currentPhase = 10;
    const outerPath = document.getElementById('outer-circle-draw-path');
    const outerPoint = document.getElementById('outer-circle-draw-point');
    const outerFlash = document.getElementById('outer-circle-flash');
    const outerHalo = document.getElementById('outer-circle-halo');
    const outerBackdrop = document.getElementById('outer-circle-disc-backdrop');
    const outerInnerRing = document.getElementById('outer-circle-inner-ring');
    const outerCorona = document.getElementById('outer-circle-corona');
    const outerSparklesGroup = document.getElementById('outer-circle-sparkles-group');
    const outerLen = outerPath ? outerPath.getTotalLength() : 2168;

    // Mostrar únicamente el trazado perimetral y fondo de contraste; todos los efectos de luces permanecen ocultos
    if (outerPath) outerPath.style.display = 'block';
    if (outerBackdrop) outerBackdrop.style.display = 'block';
    [outerPoint, outerFlash, outerHalo, outerInnerRing, outerCorona, outerSparklesGroup].forEach(el => {
      if (el) el.style.display = 'none';
    });

    if (this.enclosingTL) {
      this.enclosingTL.kill();
    }
    this.enclosingTL = gsap.timeline({
      onComplete: () => {
        this.currentPhase = 12;
        this.particles.triggerHeartsRain();
        this.particles.triggerHeartsExplosion(32);
        if (typeof onComplete === 'function') onComplete();
      }
    });
    const tl = this.enclosingTL;

    // 1. Despliegue gradual del fondo cósmico oscuro de contraste para que los textos blancos resalten al 100%
    if (outerBackdrop) {
      tl.to(outerBackdrop, {
        opacity: 0.96,
        duration: 1.6,
        ease: 'power2.inOut'
      }, 0);
    }

    // 2. Trazo circular veloz que engloba todas las 100 frases desde las 12 en punto (limpio, sin punto cometa)
    if (outerPath) {
      gsap.set(outerPath, { opacity: 1, strokeDasharray: outerLen, strokeDashoffset: outerLen });

      tl.to({ progress: 0 }, {
        progress: 1,
        duration: 1.6,
        ease: 'power2.inOut',
        onUpdate: function() {
          const prog = this.targets()[0].progress;
          const currentOffset = outerLen * (1 - prog);
          outerPath.style.strokeDashoffset = currentOffset;
        }
      }, 0);
    }

    // 3. Al completar el círculo: Se sella el círculo exterior limpio sin destellos, halos ni estrellas periféricas
    tl.call(() => {
      this.currentPhase = 11;
      if (outerPoint) gsap.set(outerPoint, { opacity: 0, display: 'none' });
      if (outerFlash) gsap.set(outerFlash, { opacity: 0, display: 'none' });
      if (outerHalo) gsap.set(outerHalo, { opacity: 0, display: 'none' });
      if (outerInnerRing) gsap.set(outerInnerRing, { opacity: 0, display: 'none' });
      if (outerCorona) gsap.set(outerCorona, { opacity: 0, display: 'none' });
      if (outerSparklesGroup) {
        outerSparklesGroup.innerHTML = '';
        gsap.set(outerSparklesGroup, { opacity: 0, display: 'none' });
      }
      
      // Limpiar cualquier rayo o línea residual que pudiera haber quedado
      const allRays = document.querySelectorAll('.radial-beam-ray');
      allRays.forEach(r => r.remove());

      // Cambiar fondo general a contraste profundo
      document.body.classList.add('encapsulated-active');

      // Activar destellos y animación ondulante diamantada en todas las 100 frases
      const phraseItems = document.querySelectorAll('.phrase-orbit-item');
      phraseItems.forEach((item, idx) => {
        item.classList.add('encapsulated');
        const title = item.querySelector('.orbit-title');
        if (title) {
          title.style.animationDelay = `${(idx * 0.035).toFixed(3)}s`;
        }
        const bullet = item.querySelector('.orbit-glow-bullet');
        if (bullet) {
          bullet.style.animationDelay = `${(idx * 0.035 + 0.15).toFixed(3)}s`;
        }
      });
    });

    return tl;
  }

  updateCentralQuote(data) {
    if (!data) return;

    // Borrar y ocultar definitivamente el corazón, I MISS YOU y 100 WAYS TO SAY IT durante las frases
    const heartEl = document.querySelector('.central-item-heart');
    if (heartEl && !heartEl.classList.contains('hidden-during-phrases')) {
      heartEl.classList.add('hidden-during-phrases');
    }
    const titleEl = document.querySelector('.central-item-title');
    if (titleEl && !titleEl.classList.contains('hidden-during-phrases')) {
      titleEl.classList.add('hidden-during-phrases');
    }
    const subheadEl = document.querySelector('.central-item-subhead');
    if (subheadEl && !subheadEl.classList.contains('hidden-during-phrases')) {
      subheadEl.classList.add('hidden-during-phrases');
    }

    const counterEl = document.querySelector('.central-quote-counter');
    const phraseEl = document.querySelector('.central-phrase-quote') || document.querySelector('.central-poem-quote');

    if (counterEl) {
      const paddedId = String(data.id).padStart(2, '0');
      counterEl.textContent = `${paddedId} / 100`;
      if (window.gsap) {
        gsap.killTweensOf(counterEl);
        gsap.fromTo(counterEl, 
          { scale: 1.22, color: '#ffffff' },
          { scale: 1.0, color: '#ffd166', duration: 0.32, ease: 'back.out(2)' }
        );
      }
    }

    if (phraseEl) {
      const continuationText = data.text || "Cada instante lejos de ti se siente como un segundo que no debió existir.";

      if (window.gsap) {
        gsap.killTweensOf(phraseEl);
        gsap.to(phraseEl, {
          opacity: 0.35,
          duration: 0.08,
          onComplete: () => {
            phraseEl.innerHTML = `
              <span class="central-phrase-continuation">«${continuationText}»</span>
            `;
            gsap.to(phraseEl, { opacity: 1, duration: 0.18, ease: 'power2.out' });
          }
        });
      } else {
        phraseEl.innerHTML = `
          <span class="central-phrase-continuation">«${continuationText}»</span>
        `;
      }
    }
  }

  showClimaxScene() {
    this.particles.triggerHeartsRain();
    const climaxModal = document.getElementById('climax-overlay');
    if (!climaxModal) return;
    climaxModal.classList.add('visible');

    if (window.gsap) {
      gsap.fromTo('.climax-content', 
        { opacity: 0, scale: 0.85, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: 'back.out(1.4)' }
      );
    }
  }

  hideClimaxScene() {
    this.particles.stopHeartsRain();
    const climaxModal = document.getElementById('climax-overlay');
    if (climaxModal) {
      climaxModal.classList.remove('visible');
    }
  }
}

// Exportar globalmente
window.AnimationManager = AnimationManager;
window.CosmicParticles = CosmicParticles;
