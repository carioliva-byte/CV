(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector(".site-header");
  const nav = document.querySelector(".site-nav");
  const toggle = document.querySelector(".nav-toggle");
  const backTop = document.querySelector(".back-top");
  const progress = document.querySelector(".scroll-progress span");
  const glow = document.querySelector(".bg-glow");
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll(".site-nav a[href^='#']");

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Mobile menu */
  const closeMenu = () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
  };

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  }

  /* Scroll: header state, progress bar, back-to-top */
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header?.classList.toggle("scrolled", y > 20);
    backTop?.classList.toggle("visible", y > 600);
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  backTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* Reveal on scroll */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${id}`));
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((section) => sectionObserver.observe(section));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* Animated counters */
  const counters = document.querySelectorAll("[data-count]");
  const runCounter = (el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion) {
      el.textContent = target;
      return;
    }
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          counterObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => counterObserver.observe(el));
  } else {
    counters.forEach(runCounter);
  }

  /* Typewriter */
  const typed = document.querySelector(".typed");
  if (typed) {
    const words = JSON.parse(typed.dataset.words || "[]");
    if (reduceMotion || !words.length) {
      typed.textContent = words[0] || "";
    } else {
      let wordIndex = 0;
      let charIndex = 0;
      let deleting = false;

      const step = () => {
        const word = words[wordIndex];
        charIndex += deleting ? -1 : 1;
        typed.textContent = word.slice(0, charIndex);

        let delay = deleting ? 35 : 70;
        if (!deleting && charIndex === word.length) {
          delay = 1800;
          deleting = true;
        } else if (deleting && charIndex === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          delay = 350;
        }
        setTimeout(step, delay);
      };
      setTimeout(step, 600);
    }
  }

  /* Cursor spotlight on cards + ambient glow */
  const cards = document.querySelectorAll(".card");
  cards.forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  });

  if (glow && !reduceMotion) {
    window.addEventListener(
      "pointermove",
      (e) => {
        glow.style.setProperty("--gx", `${(e.clientX / window.innerWidth) * 100}%`);
        glow.style.setProperty("--gy", `${(e.clientY / window.innerHeight) * 100}%`);
      },
      { passive: true }
    );
  }

  /* Stagger tags */
  document.querySelectorAll(".competencias-chips li, .tech-tags li, .areas-alvo li").forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i * 25, 300)}ms`;
  });

  /* Data network background */
  const canvas = document.getElementById("network-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const pointer = { x: -9999, y: -9999 };
  const LINK_DIST = 140;
  let nodes = [];
  let width = 0;
  let height = 0;
  let rafId = null;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(Math.floor((width * height) / 16000), 90);
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.4 + 0.6,
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);

    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    }

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < LINK_DIST) {
          ctx.strokeStyle = `rgba(90, 170, 255, ${0.14 * (1 - dist / LINK_DIST)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      const pd = Math.hypot(a.x - pointer.x, a.y - pointer.y);
      if (pd < LINK_DIST * 1.4) {
        ctx.strokeStyle = `rgba(62, 230, 255, ${0.35 * (1 - pd / (LINK_DIST * 1.4))})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(pointer.x, pointer.y);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(120, 210, 255, 0.55)";
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const loop = () => {
    draw();
    rafId = requestAnimationFrame(loop);
  };

  resize();
  window.addEventListener("resize", () => {
    resize();
    if (reduceMotion) draw();
  });

  if (reduceMotion) {
    draw();
    return;
  }

  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    },
    { passive: true }
  );
  document.addEventListener("pointerleave", () => {
    pointer.x = pointer.y = -9999;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      loop();
    }
  });

  loop();
})();
