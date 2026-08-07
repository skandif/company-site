/* ============================================================
   DGURU — shared behavior
   particle-network background · nav · reveal · counters
   ============================================================ */

(function () {
  "use strict";

  /* ---------- animated background: particle network ---------- */
  const canvas = document.getElementById("bg-canvas");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let W, H, particles, raf, resizeTimer;
    const mouse = { x: -9999, y: -9999 };

    const DENSITY = 11000; // px^2 per particle
    const LINK_DIST = 150;
    const MOUSE_DIST = 220;

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(140, Math.floor((W * H) / DENSITY));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.5,
      }));
      pulses.length = 0;
    }

    /* 데이터 펄스: 링크를 따라 은은하게 이동하는 빛 (최대 3개, 저빈도) */
    const pulses = [];
    const MAX_PULSES = 3;

    function neighborOf(p) {
      for (const q of particles) {
        if (q === p) continue;
        const dx = p.x - q.x, dy = p.y - q.y;
        if (dx * dx + dy * dy < LINK_DIST * LINK_DIST) return q;
      }
      return null;
    }

    function spawnPulse() {
      const a = particles[(Math.random() * particles.length) | 0];
      const b = neighborOf(a);
      if (b) pulses.push({ a, b, t: 0, speed: 0.008 + Math.random() * 0.004 });
    }

    function step() {
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;
      }

      // links
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            const t = 1 - Math.sqrt(d2) / LINK_DIST;
            ctx.strokeStyle = "rgba(77, 141, 255," + (t * 0.16).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        // mouse link
        const mdx = a.x - mouse.x, mdy = a.y - mouse.y;
        const md2 = mdx * mdx + mdy * mdy;
        if (md2 < MOUSE_DIST * MOUSE_DIST) {
          const t = 1 - Math.sqrt(md2) / MOUSE_DIST;
          ctx.strokeStyle = "rgba(45, 217, 255," + (t * 0.28).toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      // data pulses (은은하게, 저빈도)
      if (pulses.length < MAX_PULSES && Math.random() < 0.012) spawnPulse();
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pl = pulses[i];
        pl.t += pl.speed;
        const { a, b } = pl;
        const dx = a.x - b.x, dy = a.y - b.y;
        if (dx * dx + dy * dy > LINK_DIST * LINK_DIST * 2.6 || pl.t >= 1) {
          pulses.splice(i, 1);
          continue;
        }
        const x = a.x + (b.x - a.x) * pl.t;
        const y = a.y + (b.y - a.y) * pl.t;
        const fade = 1 - Math.abs(pl.t - 0.5) * 2;
        ctx.fillStyle = "rgba(150, 230, 255," + (0.35 + fade * 0.35).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // dots
      for (const p of particles) {
        ctx.fillStyle = "rgba(140, 190, 255, 0.55)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(step);
    }

    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });
    window.addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener("pointerleave", () => { mouse.x = -9999; mouse.y = -9999; });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(step);
    });

    resize();
    step();
  }

  /* ---------- nav: scrolled state ---------- */
  const nav = document.querySelector(".nav");

  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- icon font: reveal after load (FOUT 방지) ---------- */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => document.documentElement.classList.add("fonts-loaded"));
    setTimeout(() => document.documentElement.classList.add("fonts-loaded"), 2500); // 안전망
  } else {
    document.documentElement.classList.add("fonts-loaded");
  }

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- animated counters ---------- */
  const counterIO = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        counterIO.unobserve(en.target);
        const el = en.target;
        const target = parseFloat(el.dataset.count);
        const decimals = (el.dataset.count.split(".")[1] || "").length;
        const suffix = el.dataset.suffix || "";
        const prefix = el.dataset.prefix || "";
        if (reduceMotion) {
          el.textContent = prefix + target.toFixed(decimals) + suffix;
          continue;
        }
        const dur = 1600;
        const t0 = performance.now();
        (function tick(now) {
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      }
    },
    { threshold: 0.4 }
  );
  document.querySelectorAll("[data-count]").forEach((el) => counterIO.observe(el));

  /* ---------- card spotlight follows cursor ---------- */
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  });

  /* ---------- marquee: duplicate track content for seamless loop ---------- */
  document.querySelectorAll(".marquee-track").forEach((track) => {
    const clones = [...track.children].map((el) => {
      const c = el.cloneNode(true);
      c.setAttribute("aria-hidden", "true"); // 스크린리더 중복 낭독 방지
      return c;
    });
    clones.forEach((c) => track.appendChild(c));
  });
})();
