/* ------------------------------------------------------------------
   Site behaviour: loader, navigation, ASCII scene, email copy, clock.
   No dependencies.
------------------------------------------------------------------- */

(() => {
  "use strict";

  const body = document.body;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const pageRegions = document.querySelectorAll("main, .bar");

  const setPageInteractive = (interactive) => {
    pageRegions.forEach((el) => {
      el.inert = !interactive;
    });
  };

  /* ---------------------------------------------------------------
     Entry loader
  --------------------------------------------------------------- */
  const entry = document.querySelector(".entry");
  const entryCount = document.querySelector(".entry__count");

  const showPage = () => {
    body.classList.remove("is-loading");
    body.classList.add("is-ready");
    setPageInteractive(true);
  };

  const dismissEntry = () => {
    showPage();
    if (!entry) return;
    entry.classList.add("is-leaving");
    entry.setAttribute("aria-hidden", "true");
    window.setTimeout(() => entry.remove(), 800);
  };

  if (!entry || reduceMotion) {
    if (entry) entry.remove();
    showPage();
  } else {
    setPageInteractive(false);
    let start = null;
    const duration = 850;

    const tick = (now) => {
      if (start === null) start = now;
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (entryCount) {
        entryCount.textContent = String(Math.round(eased * 100));
      }
      entry.style.setProperty("--progress", eased.toFixed(4));
      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        if (entryCount) entryCount.textContent = "100";
        entry.style.setProperty("--progress", "1");
        window.setTimeout(dismissEntry, 160);
      }
    };

    window.requestAnimationFrame(tick);

    // Never leave a visitor staring at a loader if something goes wrong.
    window.setTimeout(() => {
      if (body.classList.contains("is-loading")) dismissEntry();
    }, 2600);
  }

  /* ---------------------------------------------------------------
     Navigation curtain
  --------------------------------------------------------------- */
  const nav = document.querySelector("[data-nav]");
  const openButtons = document.querySelectorAll("[data-nav-open]");
  const closeButtons = document.querySelectorAll("[data-nav-close]");
  const bars = document.querySelectorAll(".bar");
  const main = document.querySelector("main");

  let lastFocused = null;

  const navIsOpen = () => nav && nav.classList.contains("is-open");

  const openNav = () => {
    if (!nav || navIsOpen()) return;
    lastFocused = document.activeElement;
    nav.inert = false;
    nav.removeAttribute("inert");
    nav.setAttribute("aria-hidden", "false");
    nav.classList.add("is-open");
    body.classList.add("nav-open");

    bars.forEach((el) => {
      el.inert = true;
    });
    if (main) main.inert = true;
    openButtons.forEach((el) => el.setAttribute("aria-expanded", "true"));

    window.setTimeout(() => {
      if (!navIsOpen()) return;
      const close = nav.querySelector("[data-nav-close]");
      if (close) close.focus({ preventScroll: true });
    }, 350);
  };

  const closeNav = () => {
    if (!nav || !navIsOpen()) return;
    nav.classList.remove("is-open");
    nav.setAttribute("aria-hidden", "true");
    nav.inert = true;
    body.classList.remove("nav-open");
    openButtons.forEach((el) => el.setAttribute("aria-expanded", "false"));
    bars.forEach((el) => {
      el.inert = false;
    });
    if (main) main.inert = false;

    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus({ preventScroll: true });
    }
  };

  openButtons.forEach((button) => {
    button.addEventListener("click", openNav);
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeNav);
  });

  if (nav) {
    nav.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (link) closeNav();
    });

    nav.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeNav();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        nav.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navIsOpen()) closeNav();
  });

  /* ---------------------------------------------------------------
     Home scene: a dithered sphere made of ASCII characters.
     Slowly turns; leans toward the pointer on desktop.
  --------------------------------------------------------------- */
  const asciiOrb = document.querySelector("[data-ascii-orb]");
  const asciiToggle = document.querySelector("[data-ascii-toggle]");

  if (asciiOrb) {
    const ramp = " .:-=+*#%@";
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, lx: 0, ly: 0, tlx: 0, tly: 0, s: 0, ts: 0 };
    const ripples = [];
    const grid = { cols: 0, rows: 0, width: 0, height: 0, charW: 6, lineH: 8 };
    const startsTransformed =
      asciiToggle && asciiToggle.getAttribute("aria-pressed") === "true";
    let morph = startsTransformed ? 1 : 0;
    let morphTarget = morph;
    let raf = 0;
    let lastPaint = 0;

    const measure = () => {
      const rect = asciiOrb.getBoundingClientRect();
      const styles = window.getComputedStyle(asciiOrb);
      const fontSize = parseFloat(styles.fontSize) || 8;
      const lineHeight = parseFloat(styles.lineHeight) || fontSize * 1.06;
      const charW = fontSize * 0.602;

      grid.width = rect.width;
      grid.height = rect.height;
      grid.charW = charW;
      grid.lineH = lineHeight;
      grid.cols = Math.max(24, Math.min(110, Math.floor(rect.width / charW)));
      grid.rows = Math.max(14, Math.min(60, Math.floor(rect.height / lineHeight)));
    };

    const paint = (seconds) => {
      const { cols, rows, width, height, charW, lineH } = grid;
      if (!cols || !rows || !width || !height) return;

      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      pointer.lx += (pointer.tlx - pointer.lx) * 0.18;
      pointer.ly += (pointer.tly - pointer.ly) * 0.18;
      pointer.s += (pointer.ts - pointer.s) * 0.12;
      while (ripples.length && seconds - ripples[0].t > 2.4) ripples.shift();

      const radius = Math.min(width * 0.4, height * 0.47);
      const reach = radius * 0.5;
      const spin = seconds * 0.11 + pointer.x * 0.35;

      const cos = Math.cos(spin);
      const sin = Math.sin(spin);

      const lightX = -0.48 + pointer.x * 0.25;
      const lightY = 0.56 - pointer.y * 0.3;
      const lightZ = 0.72;
      const lightLength =
        Math.sqrt(lightX * lightX + lightY * lightY + lightZ * lightZ) || 1;

      const lines = [];

      for (let row = 0; row < rows; row += 1) {
        const py = (row + 0.5 - rows / 2) * lineH;
        let line = "";

        for (let col = 0; col < cols; col += 1) {
          const px = (col + 0.5 - cols / 2) * charW;
          // Opening the sphere flattens it and splits it along a widening seam.
          const baseNy = -py / radius;
          const ny = baseNy * (1 + 0.55 * morph);
          const nx = px / (radius * (1 + 0.12 * morph));
          const r2 = nx * nx + ny * ny;

          const dx = px - pointer.lx;
          const dy = py - pointer.ly;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const near = pointer.s * Math.exp(-(dist * dist) / (reach * reach));

          let wave = 0;
          for (let i = 0; i < ripples.length; i += 1) {
            const rp = ripples[i];
            const age = seconds - rp.t;
            const rd = Math.hypot(px - rp.x, py - rp.y);
            const front = age * radius * 1.1;
            const edge = Math.exp(-Math.pow((rd - front) / (radius * 0.16), 2));
            wave += edge * Math.max(0, 1 - age / 2.4);
          }

          if (r2 > 1 || Math.abs(baseNy) < 0.1 * morph) {
            // loose dust that gathers around the cursor and rides the ripple
            const h = Math.sin(col * 12.9898 + row * 78.233) * 43758.5453;
            const rnd = h - Math.floor(h);
            const strength = near * 0.9 + wave * 0.6;
            if (strength > 0.2 && r2 < 1.5 && rnd < strength) {
              line += rnd < strength * 0.4 ? ":" : ".";
            } else {
              line += " ";
            }
            continue;
          }

          const nz = Math.sqrt(1 - r2);

          // Rotate the surface, not the light.
          const rx = nx * cos + nz * sin;
          const rz = -nx * sin + nz * cos;

          let light =
            (rx * lightX + ny * lightY + rz * lightZ) / lightLength;
          light = Math.max(0, light);

          // A gentle latitude band keeps the surface feeling alive.
          const band =
            0.9 + 0.1 * Math.sin(ny * 18 + seconds * 0.4) * Math.cos(rx * 8);

          let value = Math.pow(light, 0.8) * 0.94 * band;
          value += 0.08;
          // cursor lifts the surface and brightens it; ripples pass through
          value += near * 0.4 + wave * 0.35;

          // Brighten the lips of the opening using the same character ramp.
          if (morph > 0) {
            const lip =
              Math.max(0, 1 - Math.abs(Math.abs(baseNy) - 0.1 * morph) / 0.05) *
              morph;
            value += lip * 0.1;
          }

          const index = Math.max(
            0,
            Math.min(ramp.length - 1, Math.round(value * (ramp.length - 1)))
          );
          line += ramp[index];
        }

        lines.push(line);
      }

      asciiOrb.textContent = lines.join("\n");
    };

    const paintStill = () => paint(reduceMotion ? 2.4 : performance.now() / 1000);

    const syncToggle = () => {
      if (!asciiToggle) return;
      const transformed = morphTarget === 1;
      asciiToggle.setAttribute("aria-pressed", transformed ? "true" : "false");
      asciiToggle.setAttribute(
        "aria-label",
        transformed ? "restore sphere" : "transform sphere"
      );
      asciiToggle.classList.toggle("is-transformed", transformed);
    };

    if (asciiToggle) {
      asciiToggle.addEventListener("click", () => {
        morphTarget = morphTarget === 1 ? 0 : 1;
        syncToggle();
        if (reduceMotion) {
          morph = morphTarget;
          paintStill();
        }
      });
      syncToggle();
    }

    const frame = (now) => {
      if (document.hidden) {
        raf = 0;
        return;
      }
      if (Math.abs(morphTarget - morph) > 0.002) {
        morph += (morphTarget - morph) * 0.12;
      } else {
        morph = morphTarget;
      }
      if (now - lastPaint > 45) {
        paint(now / 1000);
        lastPaint = now;
      }
      raf = window.requestAnimationFrame(frame);
    };

    const restart = () => {
      measure();
      paintStill();
      window.cancelAnimationFrame(raf);
      if (!reduceMotion) raf = window.requestAnimationFrame(frame);
    };

    const toLocal = (event) => {
      const rect = asciiOrb.getBoundingClientRect();
      pointer.tlx = event.clientX - (rect.left + rect.width / 2);
      pointer.tly = event.clientY - (rect.top + rect.height / 2);
    };

    window.addEventListener("pointermove", (event) => {
      pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
      toLocal(event);
      pointer.ts = 1;
    });

    document.addEventListener("pointerleave", () => {
      pointer.ts = 0;
    });

    window.addEventListener("pointerdown", (event) => {
      toLocal(event);
      pointer.lx = pointer.tlx;
      pointer.ly = pointer.tly;
      ripples.push({ t: performance.now() / 1000, x: pointer.tlx, y: pointer.tly });
      if (ripples.length > 4) ripples.shift();
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && !reduceMotion && !raf) {
        lastPaint = 0;
        raf = window.requestAnimationFrame(frame);
      }
    });

    if (typeof ResizeObserver !== "undefined") {
      let resizeTimer = 0;
      const observer = new ResizeObserver(() => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(restart, 120);
      });
      observer.observe(asciiOrb);
    } else {
      window.addEventListener("resize", restart);
    }

    restart();
  }

  /* ---------------------------------------------------------------
     Copy email address
  --------------------------------------------------------------- */
  const copyButtons = document.querySelectorAll("[data-copy-email]");

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch (fallbackError) {
        copied = false;
      }
      field.remove();
      return copied;
    }
  };

  copyButtons.forEach((button) => {
    const email = button.getAttribute("data-copy-email");
    const holder = button.closest(".contact__mail") || button.parentElement;
    const status = holder.querySelector("[data-copy-status]");
    let timer = null;

    button.addEventListener("click", async () => {
      if (!email) return;
      const copied = await copyText(email);
      if (!copied) return;

      button.classList.add("is-copied");
      if (status) status.textContent = "Copied!";

      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        button.classList.remove("is-copied");
        if (status) status.textContent = "";
      }, 1800);
    });
  });

  /* ---------------------------------------------------------------
     Local time
  --------------------------------------------------------------- */
  const clocks = document.querySelectorAll("[data-clock]");

  if (clocks.length) {
    const format = () => {
      const value = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date());
      clocks.forEach((clock) => {
        clock.textContent = value;
      });
    };

    format();
    window.setInterval(format, 20000);
  }

  /* ---------------------------------------------------------------
     Mark current page in the nav
  --------------------------------------------------------------- */
  if (nav) {
    const here = window.location.pathname.split("/").pop() || "index.html";
    nav.querySelectorAll("a[href]").forEach((link) => {
      const target = link.getAttribute("href");
      if (!target || target.startsWith("http") || target.startsWith("#")) return;
      if (target === here) link.setAttribute("aria-current", "page");
    });
  }

  /* ---------------------------------------------------------------
     Make sure the page is usable if the entry never resolves.
  --------------------------------------------------------------- */
  window.addEventListener("pageshow", () => {
    if (body.classList.contains("is-loading")) dismissEntry();
  });
})();
