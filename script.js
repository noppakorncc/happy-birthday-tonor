(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.innerWidth < 720;

  var pages = Array.prototype.slice.call(document.querySelectorAll(".page"));
  var transitionOverlay = document.getElementById("transitionOverlay");
  var starsLayer = document.getElementById("stars");
  var heartsLayer = document.getElementById("hearts");
  var confettiLayer = document.getElementById("confetti");
  var particlesCanvas = document.getElementById("particles");
  var ctx = particlesCanvas.getContext("2d");

  var cakeWrap = document.getElementById("cakeWrap");
  var smokeLayer = document.getElementById("smokeLayer");
  var flame = document.getElementById("flame");
  var wishBtn = document.getElementById("wishBtn");
  var wishReveal = document.getElementById("wishReveal");
  var wishPage = document.getElementById("page-wish");

  var secretHeart = document.getElementById("secretHeart");
  var secretModal = document.getElementById("secretModal");
  var secretClose = document.getElementById("secretClose");
  var secretCard = document.querySelector(".secret-card");
  var secretPixelWrap = document.querySelector(".secret-pixel-wrap");
  var secretOpen = false;

  var lockModal = document.getElementById("lockModal");
  var lockCard = document.getElementById("lockCard");
  var lockClose = document.getElementById("lockClose");
  var lockIcon = document.getElementById("lockIcon");
  var lockDigitsWrap = document.getElementById("lockDigits");
  var lockInputs = Array.prototype.slice.call(lockDigitsWrap.querySelectorAll(".lock-digit"));
  var lockUnlockBtn = document.getElementById("lockUnlock");
  var lockError = document.getElementById("lockError");
  var lockSuccess = document.getElementById("lockSuccess");
  var lockTipBtn = document.getElementById("lockTip");
  var lockTipText = document.getElementById("lockTipText");
  var lockTipLevel = 0;
  var lockOpen = false;
  var lockUnlocked = false;
  var lockShakeId = null;

  var BIRTHDAY_CODE = "0308";

  var currentPage = 0;
  var isTransitioning = false;
  var wished = false;

  var TRANSITION_MS = 460;
  var MAX_PARTICLES = isMobile ? 14 : 30;
  var PARTICLE_COLORS = ["#FFFFFF", "#FFEAF2", "#FFC4D8", "#FFAAC8", "#E8D7F4"];

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randInt(min, max) {
    return Math.floor(rand(min, max + 1));
  }

  function goToPage(index) {
    pages.forEach(function (page, i) {
      page.classList.toggle("is-active", i === index);
    });
    currentPage = index;
    starsLayer.classList.toggle("is-bright", index === 2);
  }

  function transitionToPage(index) {
    if (isTransitioning) return;
    if (reduceMotion) {
      goToPage(index);
      return;
    }
    isTransitioning = true;
    transitionOverlay.classList.add("is-open");
    window.setTimeout(function () {
      goToPage(index);
      transitionOverlay.classList.remove("is-open");
      isTransitioning = false;
    }, TRANSITION_MS);
  }

  function openGift() {
    if (isTransitioning) return;
    playMusic();
    if (lockUnlocked) {
      transitionToPage(1);
    } else {
      openLockModal();
    }
  }

  /* ------------------------------------------------------------------
     Ambient music
  ------------------------------------------------------------------ */

  var MUSIC_VOLUME = 0.25;
  var MUSIC_FADE_MS = 600;

  var musicBtn = document.getElementById("musicBtn");
  var musicIcon = document.getElementById("musicIcon");
  var music;
  var musicPlaying = false;
  var musicFadeId = null;

  function initMusic() {
    music = new Audio("assets/music/Flower_Day.mp3");
    music.loop = true;
    music.volume = 0;
    musicBtn.addEventListener("click", toggleMusic);
  }

  function setMusicUI() {
    musicBtn.classList.toggle("is-playing", musicPlaying);
    musicBtn.setAttribute("aria-label", musicPlaying ? "Pause background music" : "Play background music");
    musicBtn.setAttribute("title", musicPlaying ? "Pause music" : "Play music");
    musicIcon.className = musicPlaying ? "ri-volume-up-line" : "ri-volume-mute-line";
  }

  function fadeMusicTo(target, duration, done) {
    if (musicFadeId !== null) {
      window.cancelAnimationFrame(musicFadeId);
    }
    var start = music.volume;
    var startTime = performance.now();
    function frame(now) {
      var t = Math.min(1, (now - startTime) / duration);
      music.volume = start + (target - start) * t;
      if (t < 1) {
        musicFadeId = window.requestAnimationFrame(frame);
      } else {
        musicFadeId = null;
        if (done) done();
      }
    }
    musicFadeId = window.requestAnimationFrame(frame);
  }

  function playMusic() {
    if (musicPlaying) return;
    var promise = music.play();
    if (promise && typeof promise.then === "function") {
      promise
        .then(function () {
          musicPlaying = true;
          setMusicUI();
          fadeMusicTo(MUSIC_VOLUME, MUSIC_FADE_MS);
        })
        .catch(function () {
          musicPlaying = false;
          setMusicUI();
        });
    } else {
      musicPlaying = true;
      setMusicUI();
      fadeMusicTo(MUSIC_VOLUME, MUSIC_FADE_MS);
    }
  }

  function pauseMusic() {
    if (!musicPlaying) return;
    musicPlaying = false;
    setMusicUI();
    fadeMusicTo(0, MUSIC_FADE_MS, function () {
      if (!musicPlaying) music.pause();
    });
  }

  function toggleMusic() {
    if (musicPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  }

  /* ------------------------------------------------------------------
     Stars
  ------------------------------------------------------------------ */

  function createStars() {
    if (reduceMotion) return;
    var count = isMobile ? 12 : 22;
    var i;
    for (i = 0; i < count; i++) {
      var star = document.createElement("i");
      star.className = Math.random() > 0.5 ? "ri-star-line star" : "ri-sparkling-line star";
      star.style.left = rand(2, 98) + "%";
      star.style.top = rand(4, 58) + "%";
      star.style.fontSize = rand(8, 18) + "px";
      star.style.animationDuration = rand(2.4, 5.2).toFixed(2) + "s";
      star.style.animationDelay = "-" + rand(0, 4).toFixed(2) + "s";
      starsLayer.appendChild(star);
    }
  }

  /* ------------------------------------------------------------------
     Ambient particles (canvas)
  ------------------------------------------------------------------ */

  var particles = [];
  var canvasW = 0;
  var canvasH = 0;

  function resizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasW = window.innerWidth;
    canvasH = window.innerHeight;
    particlesCanvas.width = Math.round(canvasW * dpr);
    particlesCanvas.height = Math.round(canvasH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnParticle(burst) {
    var types = ["dot", "dot", "star", "sparkle", "heart"];
    return {
      type: types[randInt(0, types.length - 1)],
      x: rand(0, canvasW),
      y: burst ? rand(canvasH * 0.45, canvasH + 20) : rand(canvasH * 0.3, canvasH + 20),
      size: rand(1.6, burst ? 4.5 : 3.2),
      color: PARTICLE_COLORS[randInt(0, PARTICLE_COLORS.length - 1)],
      opacity: rand(0.15, 0.55),
      vy: rand(-0.75, -0.3) * (burst ? 1.8 : 1),
      vx: rand(-0.14, 0.14),
      phase: rand(0, Math.PI * 2),
      drift: rand(-0.015, 0.015),
      rot: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.03, 0.03),
      life: rand(220, 340),
      maxLife: 340
    };
  }

  function drawStarShape(s) {
    ctx.beginPath();
    var i;
    for (i = 0; i < 10; i++) {
      var radius = i % 2 === 0 ? s : s * 0.42;
      var angle = (i * Math.PI) / 5 - Math.PI / 2;
      var px = Math.cos(angle) * radius;
      var py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawSparkleShape(s) {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(0, 0, s, 0);
    ctx.quadraticCurveTo(0, 0, 0, s);
    ctx.quadraticCurveTo(0, 0, -s, 0);
    ctx.quadraticCurveTo(0, 0, 0, -s);
    ctx.fill();
  }

  function drawHeartShape(s) {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.4);
    ctx.bezierCurveTo(s * 0.55, -s * 0.05, s * 0.55, -s * 0.5, 0, -s * 0.22);
    ctx.bezierCurveTo(-s * 0.55, -s * 0.5, -s * 0.55, -s * 0.05, 0, s * 0.4);
    ctx.fill();
  }

  function drawParticle(p, alpha) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    if (p.type === "dot") {
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === "star") {
      drawStarShape(p.size);
    } else if (p.type === "sparkle") {
      drawSparkleShape(p.size);
    } else {
      drawHeartShape(p.size);
    }
    ctx.restore();
  }

  function stepParticles() {
    ctx.clearRect(0, 0, canvasW, canvasH);
    var i;
    for (i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life -= 1;
      p.phase += p.drift;
      p.x += p.vx + Math.sin(p.phase) * 0.16;
      p.y += p.vy;
      p.rot += p.rotSpeed;

      if (p.life <= 0 || p.y < -24) {
        particles.splice(i, 1);
        continue;
      }

      var fade = Math.min(1, p.life / 60);
      var bottomFade = p.y > canvasH - 40 ? (canvasH - p.y) / 40 : 1;
      drawParticle(p, p.opacity * fade * bottomFade);
    }
  }

  function initParticles() {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    if (reduceMotion) return;

    window.setInterval(function () {
      if (particles.length < MAX_PARTICLES) particles.push(spawnParticle(false));
    }, 420);

    window.setInterval(stepParticles, 33);
  }

  function burstParticles(count) {
    if (reduceMotion) return;
    for (var i = 0; i < count; i++) {
      particles.push(spawnParticle(true));
    }
  }

  /* ------------------------------------------------------------------
     Floating hearts
  ------------------------------------------------------------------ */

  function createFloatingHeart() {
    if (reduceMotion) return;
    var heart = document.createElement("i");
    heart.className = "ri-heart-3-line float-heart";
    heart.style.setProperty("--x", rand(4, 96) + "vw");
    heart.style.setProperty("--size", rand(11, 22).toFixed(0) + "px");
    heart.style.setProperty("--dur", rand(6.5, 11).toFixed(1) + "s");
    heart.style.setProperty("--o", rand(0.18, 0.42).toFixed(2));
    heartsLayer.appendChild(heart);
    window.setTimeout(function () {
      heart.remove();
    }, 12000);
  }

  function spawnHearts(count) {
    for (var i = 0; i < count; i++) {
      window.setTimeout(createFloatingHeart, i * 420);
    }
  }

  function startHearts() {
    window.setTimeout(createFloatingHeart, 1400);
    window.setInterval(function () {
      if (document.visibilityState === "visible") createFloatingHeart();
    }, 3600);
  }

  /* ------------------------------------------------------------------
     Confetti
  ------------------------------------------------------------------ */

  function launchConfetti() {
    if (reduceMotion) return;
    var colors = ["#FFFFFF", "#FFEAF2", "#FFC4D8", "#FFAAC8", "#F47FA7", "#D65C8A", "#E8D7F4"];
    var count = isMobile ? 34 : 56;
    for (var i = 0; i < count; i++) {
      var piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.setProperty("--x", rand(0, 100) + "vw");
      piece.style.setProperty("--size", rand(6, 11).toFixed(0) + "px");
      piece.style.setProperty("--color", colors[randInt(0, colors.length - 1)]);
      piece.style.setProperty("--dur", rand(2.6, 4.4).toFixed(1) + "s");
      piece.style.setProperty("--delay", rand(0, 0.9).toFixed(2) + "s");
      piece.style.setProperty("--sway", rand(-90, 90).toFixed(0) + "px");
      piece.style.setProperty("--spin", rand(360, 900).toFixed(0) + "deg");
      piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      confettiLayer.appendChild(piece);
      window.setTimeout(function (el) {
        el.remove();
      }, 5600, piece);
    }
  }

  /* ------------------------------------------------------------------
     Smoke
  ------------------------------------------------------------------ */

  function smokeBurst() {
    if (reduceMotion) return;
    for (var i = 0; i < 6; i++) {
      var smoke = document.createElement("span");
      smoke.className = "smoke";
      smoke.style.setProperty("--dx", rand(-26, 26).toFixed(0) + "px");
      smoke.style.setProperty("--dur", rand(1.4, 2.2).toFixed(1) + "s");
      smoke.style.setProperty("--delay", rand(0, 0.4).toFixed(2) + "s");
      smokeLayer.appendChild(smoke);
      window.setTimeout(function (el) {
        el.remove();
      }, 2800, smoke);
    }
  }

  /* ------------------------------------------------------------------
     Make a wish sequence
  ------------------------------------------------------------------ */

  function showWishGif() {
    wishPage.classList.add("is-celebrating");
    wishReveal.classList.add("is-shown");
    window.setTimeout(function () {
      wishReveal.classList.add("is-subtle");
    }, 4600);
  }

  function makeWish() {
    if (wished) return;
    wished = true;

    if (reduceMotion) {
      cakeWrap.classList.add("is-glowing", "is-wishing");
      flame.classList.add("is-blow", "is-gone");
      starsLayer.classList.add("is-bright");
      wishBtn.classList.add("is-pressed", "is-hidden");
      showWishGif();
      wishReveal.classList.add("is-visible", "is-full");
      return;
    }

    wishBtn.classList.add("is-pressed");

    window.setTimeout(function () {
      flame.classList.add("is-blow");
    }, 200);

    window.setTimeout(function () {
      flame.classList.add("is-gone");
      cakeWrap.classList.add("is-wishing");
    }, 500);

    window.setTimeout(function () {
      smokeBurst();
    }, 600);

    window.setTimeout(function () {
      cakeWrap.classList.add("is-glowing");
    }, 700);

    window.setTimeout(function () {
      starsLayer.classList.add("is-bright");
    }, 800);

    window.setTimeout(function () {
      spawnHearts(4);
    }, 900);

    window.setTimeout(function () {
      launchConfetti();
    }, 1000);

    window.setTimeout(function () {
      showWishGif();
    }, 1100);

    window.setTimeout(function () {
      wishBtn.classList.add("is-hidden");
      wishReveal.classList.add("is-visible");
    }, 1200);

    window.setTimeout(function () {
      wishReveal.classList.add("is-full");
    }, 1900);
  }

  /* ------------------------------------------------------------------
     Secret message
  ------------------------------------------------------------------ */

  function secretSparkles() {
    if (reduceMotion) return;
    var rect = secretHeart.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var i;
    for (i = 0; i < 8; i++) {
      var spark = document.createElement("i");
      spark.className = i % 2 === 0 ? "ri-sparkling-2-line sparkle-pop" : "ri-star-line sparkle-pop";
      var angle = (Math.PI * 2 * i) / 8 + rand(-0.4, 0.4);
      var dist = rand(36, 66);
      spark.style.left = cx + "px";
      spark.style.top = cy + "px";
      spark.style.setProperty("--dx", (Math.cos(angle) * dist).toFixed(0) + "px");
      spark.style.setProperty("--dy", (Math.sin(angle) * dist).toFixed(0) + "px");
      document.body.appendChild(spark);
      window.setTimeout(function (el) {
        el.remove();
      }, 800, spark);
    }
  }

  function secretHearts() {
    if (reduceMotion) return;
    var i;
    for (i = 0; i < 4; i++) {
      var heart = document.createElement("i");
      heart.className = "ri-heart-3-line pixel-heart";
      heart.style.left = rand(20, 80) + "%";
      heart.style.top = rand(10, 60) + "%";
      heart.style.animationDelay = rand(0, 0.9).toFixed(2) + "s";
      secretPixelWrap.appendChild(heart);
      window.setTimeout(function (el) {
        el.remove();
      }, 4200, heart);
    }
  }

  function openSecret() {
    if (secretOpen) return;
    secretOpen = true;
    secretHeart.classList.add("is-bursting");
    secretSparkles();
    secretModal.hidden = false;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        secretModal.classList.add("is-open");
      });
    });
    window.setTimeout(function () {
      secretHearts();
    }, 3600);
    secretClose.focus();
  }

  function closeSecret() {
    if (!secretOpen) return;
    secretOpen = false;
    secretModal.classList.remove("is-open");
    secretHeart.classList.remove("is-bursting");
    window.setTimeout(function () {
      secretModal.hidden = true;
    }, 700);
    secretHeart.focus();
  }

  function trapSecretFocus(e) {
    if (!secretOpen || e.key !== "Tab") return;
    var focusables = secretCard.querySelectorAll("button, [href], [tabindex]");
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* ------------------------------------------------------------------
     Birthday Lock
  ------------------------------------------------------------------ */

  function openLockModal() {
    if (lockUnlocked) return;
    clearLockDigits();
    lockError.classList.remove("is-shown");
    lockSuccess.classList.remove("is-shown");
    lockTipLevel = 0;
    lockTipBtn.disabled = false;
    lockTipText.textContent = "";
    lockTipText.classList.remove("is-shown");
    lockModal.hidden = false;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        lockModal.classList.add("is-open");
      });
    });
    lockOpen = true;
    window.setTimeout(function () {
      lockInputs[0].focus();
    }, 90);
  }

  function closeLockModal() {
    if (!lockOpen || lockUnlocked) return;
    lockOpen = false;
    lockModal.classList.remove("is-open");
    lockModal.classList.remove("is-unlocked");
    window.setTimeout(function () {
      lockModal.hidden = true;
    }, 560);
    document.getElementById("giftBtn").focus();
  }

  function trapLockFocus(e) {
    if (!lockOpen || e.key !== "Tab") return;
    var focusables = lockCard.querySelectorAll("button, [href], [tabindex], input");
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function showLockError() {
    if (!lockError.innerHTML) {
      lockError.innerHTML =
        '<span class="error-en">Hmm... not quite ♡</span>' +
        '<span class="error-th">ลองนึกถึงวันพิเศษของตัวเองดูนะ ✦</span>';
    }
    lockError.classList.add("is-shown");
    lockSuccess.classList.remove("is-shown");
  }

  function shakeLock() {
    lockIcon.classList.remove("is-shaking");
    lockDigitsWrap.classList.remove("is-shaking");
    void lockIcon.offsetWidth;
    lockIcon.classList.add("is-shaking");
    void lockDigitsWrap.offsetWidth;
    lockDigitsWrap.classList.add("is-shaking");
    window.clearTimeout(lockShakeId);
    lockShakeId = window.setTimeout(function () {
      lockIcon.classList.remove("is-shaking");
      lockDigitsWrap.classList.remove("is-shaking");
    }, 450);
  }

  function clearLockDigits() {
    lockDigitsWrap.classList.remove("is-unlocked");
    lockInputs.forEach(function (box) {
      box.value = "";
      box.disabled = false;
      box.classList.remove("has-value");
    });
  }

  function getLockCode() {
    var i;
    var code = "";
    for (i = 0; i < lockInputs.length; i++) {
      code += lockInputs[i].value;
    }
    return code;
  }

  function unlockSuccess() {
    if (lockUnlocked) return;
    lockUnlocked = true;

    lockError.classList.remove("is-shown");
    lockInputs.forEach(function (box) {
      box.disabled = true;
      box.blur();
    });
    lockDigitsWrap.classList.add("is-unlocked");
    lockIcon.classList.remove("is-shaking");
    lockIcon.classList.add("is-success");
    lockTipBtn.disabled = true;

    lockUnlockBtn.innerHTML = '<i class="ri-checkbox-circle-line"></i> KEY ACCEPTED';
    lockUnlockBtn.disabled = true;

    lockModal.classList.add("is-unlocked");

    lockSuccess.innerHTML =
      '<span class="success-en">KEY ACCEPTED ✦</span>' +
      '<span class="success-note">The birthday gift is unlocked ♡</span>';
    lockSuccess.classList.add("is-shown");

    if (!reduceMotion) {
      spawnHearts(4);
      burstParticles(18);
    }

    window.setTimeout(function () {
      lockModal.classList.remove("is-open");
    }, 1000);

    window.setTimeout(function () {
      lockModal.hidden = true;
      transitionToPage(1);
    }, 1500);
  }

  function attemptUnlock() {
    if (lockUnlocked || !lockOpen) return;
    if (getLockCode() === BIRTHDAY_CODE) {
      unlockSuccess();
    } else {
      showLockError();
      shakeLock();
    }
  }

  function showLockTip() {
    if (lockUnlocked) return;
    if (lockTipLevel === 0) {
      lockTipText.textContent = "ตัวช่วย: เริ่มต้นด้วย 03 หาอีก 2 ตัวที่เหลือ คำใบ้คือเดือนเกิดนะ";
    } else {
      lockTipText.textContent = "เดือนเกิดคือ 08 เฉลยก็คือ 0308 — ต้นอ้อทำได้!";
      lockTipBtn.disabled = true;
    }
    lockTipText.classList.add("is-shown");
    lockTipLevel += 1;
  }

  function wireLockDigit(box, index) {
    box.addEventListener("input", function () {
      var clean = this.value.replace(/\D/g, "").slice(0, 1);
      if (clean !== this.value) this.value = clean;
      this.classList.toggle("has-value", clean.length === 1);
      if (clean.length === 1 && lockInputs[index + 1]) {
        lockInputs[index + 1].focus();
      }
    });
    box.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && this.value === "" && index > 0) {
        e.preventDefault();
        lockInputs[index - 1].focus();
      }
      if (e.key === "Enter") attemptUnlock();
    });
    box.addEventListener("paste", function (e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "");
      var i;
      for (i = 0; i < text.length && i < lockInputs.length; i++) {
        lockInputs[i].value = text.charAt(i);
        lockInputs[i].classList.add("has-value");
      }
      if (text.length >= 4) {
        attemptUnlock();
      } else {
        lockInputs[Math.min(text.length, lockInputs.length - 1)].focus();
      }
    });
  }

  /* ------------------------------------------------------------------
     Wire up
  ------------------------------------------------------------------ */

  function wireEvents() {
    document.getElementById("giftBtn").addEventListener("click", openGift);
    document.getElementById("moreBtn").addEventListener("click", function () {
      transitionToPage(2);
    });

    wishBtn.addEventListener("click", makeWish);

    lockUnlockBtn.addEventListener("click", attemptUnlock);
    lockClose.addEventListener("click", closeLockModal);
    lockTipBtn.addEventListener("click", showLockTip);
    lockModal.addEventListener("click", function (e) {
      if (e.target === lockModal) closeLockModal();
    });
    lockInputs.forEach(wireLockDigit);

    Array.prototype.forEach.call(document.querySelectorAll(".back-btn"), function (btn) {
      btn.addEventListener("click", function () {
        if (isTransitioning) return;
        goToPage(parseInt(btn.getAttribute("data-go"), 10));
      });
    });

    secretHeart.addEventListener("click", openSecret);
    secretClose.addEventListener("click", closeSecret);
    secretModal.addEventListener("click", function (e) {
      if (e.target === secretModal) closeSecret();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lockOpen && !lockUnlocked) closeLockModal();
      if (e.key === "Escape" && secretOpen) closeSecret();
      trapSecretFocus(e);
      trapLockFocus(e);
    });
  }

  function init() {
    resizeCanvas();
    createStars();
    initParticles();
    startHearts();
    initMusic();
    wireEvents();
  }

  init();
})();
