/* Fancy Studio — interactions & motion */
(function () {
  "use strict";

  var doc = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var DICT = window.FS_I18N || {};
  var LANGS = ["ka", "ru", "en"];

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------------------------------------------------------------
     i18n
  --------------------------------------------------------------- */
  function splitWords(el) {
    var text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.innerHTML = text.split(/\s+/).map(function (w, i) {
      return '<span class="w" aria-hidden="true"><i style="--i:' + i + '">' + w + "</i></span>";
    }).join(" ");
  }

  function buildMarquee(lang) {
    var track = $("[data-marquee]");
    if (!track) return;
    var items = (DICT[lang] && DICT[lang].marquee) || [];
    var html = "";
    for (var r = 0; r < 4; r++) {
      html += items.map(function (t) { return '<span class="marquee__item">' + t + "</span>"; }).join("");
    }
    track.innerHTML = html;
  }

  function positionLangPill() {
    var active = $(".lang__btn[aria-pressed='true']");
    var pill = $(".lang__pill");
    if (!active || !pill) return;
    pill.style.width = active.offsetWidth + "px";
    pill.style.transform = "translateX(" + active.offsetLeft + "px)";
  }

  function applyLang(lang) {
    var d = DICT[lang];
    if (!d) return;
    doc.lang = lang;
    $$("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (d[key] == null) return;
      el.textContent = d[key];
      if (el.classList.contains("split")) splitWords(el);
    });
    document.title = d["meta.title"];
    var md = $('meta[name="description"]');
    if (md) md.setAttribute("content", d["meta.desc"]);
    $$(".lang__btn").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === lang)); });
    buildMarquee(lang);
    positionLangPill();
    store("fs-lang", lang);
  }

  function initialLang() {
    var fromUrl = new URLSearchParams(location.search).get("lang");
    if (LANGS.indexOf(fromUrl) > -1) return fromUrl;
    var saved = store("fs-lang");
    if (LANGS.indexOf(saved) > -1) return saved;
    var nav = (navigator.language || "ka").slice(0, 2).toLowerCase();
    return LANGS.indexOf(nav) > -1 ? nav : "ka";
  }

  $$(".lang__btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var lang = btn.dataset.lang;
      if (lang === doc.lang) return;
      body.classList.add("lang-swapping");
      setTimeout(function () {
        var title = $(".hero__title");
        title.classList.add("is-reset");
        applyLang(lang);
        void title.offsetWidth;
        requestAnimationFrame(function () {
          title.classList.remove("is-reset");
          body.classList.remove("lang-swapping");
        });
      }, reduceMotion ? 0 : 260);
    });
  });

  applyLang(initialLang());
  window.addEventListener("resize", positionLangPill);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(positionLangPill);

  var year = $("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------
     Preloader → hero intro
  --------------------------------------------------------------- */
  var preloader = $(".preloader");
  function startSite() {
    if (!preloader || preloader.classList.contains("is-done")) return;
    preloader.classList.add("is-done");
    setTimeout(function () {
      body.classList.remove("is-loading");
      body.classList.add("is-ready");
    }, reduceMotion ? 0 : 520);
  }
  var minTime = reduceMotion ? 0 : 1500;
  var t0 = performance.now();
  function onLoaded() { setTimeout(startSite, Math.max(0, minTime - (performance.now() - t0))); }
  if (document.readyState === "complete") onLoaded(); else window.addEventListener("load", onLoaded);
  setTimeout(startSite, 4000); // safety net

  /* ---------------------------------------------------------------
     Header: shrink, hide on scroll down, active link, progress
  --------------------------------------------------------------- */
  var header = $(".header");
  var progress = $(".scroll-progress i");
  var sticky = $(".sticky-book");
  var lastY = window.scrollY;
  var sections = $$("main section[id]");
  var navLinks = $$(".nav__link");

  function onScroll() {
    var y = window.scrollY;
    var max = doc.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    header.classList.toggle("is-scrolled", y > 40);
    var menuOpen = body.classList.contains("menu-open");
    header.classList.toggle("is-hidden", !menuOpen && y > lastY && y > 420);
    if (sticky) sticky.classList.toggle("is-visible", y > 600 && y < max - 500);
    lastY = y;

    var current = sections[0] && sections[0].id;
    sections.forEach(function (s) { if (s.getBoundingClientRect().top < window.innerHeight * 0.4) current = s.id; });
    navLinks.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + current); });
  }
  window.addEventListener("scroll", function () { requestAnimationFrame(onScroll); }, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------
     Mobile menu
  --------------------------------------------------------------- */
  var burger = $(".burger");
  var menu = $(".mobile-menu");
  function setMenu(open) {
    body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
    if (open) header.classList.remove("is-hidden");
  }
  burger.addEventListener("click", function () { setMenu(!body.classList.contains("menu-open")); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { setMenu(false); closeLightbox(); } });

  /* ---------------------------------------------------------------
     Scroll reveal
  --------------------------------------------------------------- */
  var revealEls = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target._revealTarget || en.target;
          el.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) {
      // clip-path masks hide the element from IntersectionObserver, so watch the parent instead
      if (el.getAttribute("data-reveal") === "mask") {
        el.parentElement._revealTarget = el;
        io.observe(el.parentElement);
      } else io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------------------------------------------------------------
     Count-up rating
  --------------------------------------------------------------- */
  $$("[data-count]").forEach(function (el) {
    var target = parseFloat(el.dataset.count);
    function run() {
      if (reduceMotion) { el.textContent = target.toFixed(1); return; }
      var start = performance.now(), dur = 1800;
      (function tick(now) {
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 4);
        el.textContent = (target * eased).toFixed(1);
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    }
    if ("IntersectionObserver" in window) {
      var cio = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { run(); cio.disconnect(); }
      }, { threshold: 0.5 });
      cio.observe(el);
    } else run();
  });

  /* ---------------------------------------------------------------
     Parallax (data-speed)
  --------------------------------------------------------------- */
  var parallax = $$("[data-speed]");
  if (!reduceMotion && parallax.length) {
    var ticking = false;
    function updateParallax() {
      var vh = window.innerHeight;
      parallax.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var speed = parseFloat(el.dataset.speed);
        var offset = (r.top + r.height / 2 - vh / 2) * speed;
        el.style.translate = "0 " + offset.toFixed(1) + "px";
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(updateParallax); } }, { passive: true });
    window.addEventListener("resize", updateParallax);
    updateParallax();
  }

  /* ---------------------------------------------------------------
     Hero visual follows pointer (desktop)
  --------------------------------------------------------------- */
  var heroVisual = $(".hero__visual");
  if (finePointer && !reduceMotion && heroVisual) {
    var hero = $(".hero");
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      $$(".float-card, .rating-chip", heroVisual).forEach(function (el, i) {
        var depth = (i + 1) * 14;
        el.style.transform = "translate(" + (x * depth).toFixed(1) + "px," + (y * depth).toFixed(1) + "px)";
        el.style.transition = "transform .8s cubic-bezier(.22,1,.36,1), opacity 1s";
      });
    });
  }

  /* ---------------------------------------------------------------
     Tilt cards
  --------------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    $$(".tilt").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateX(" + (-y * 7).toFixed(2) + "deg) rotateY(" + (x * 7).toFixed(2) + "deg) translateY(-6px)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------------------------------------------------------------
     Magnetic buttons
  --------------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    $$(".magnetic").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + (x * 0.25).toFixed(1) + "px," + (y * 0.35).toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
  }

  /* ---------------------------------------------------------------
     Custom cursor
  --------------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    body.classList.add("has-cursor");
    var cursor = $(".cursor"), dot = $(".cursor__dot"), ring = $(".cursor__ring");
    var mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px)";
    }, { passive: true });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = "translate(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px)";
      requestAnimationFrame(loop);
    })();
    document.addEventListener("pointerover", function (e) {
      var t = e.target;
      cursor.classList.toggle("is-view", !!t.closest(".gallery__item"));
      cursor.classList.toggle("is-hover", !t.closest(".gallery__item") && !!t.closest("a, button, .service-card"));
    });
    document.addEventListener("pointerleave", function () { mx = my = -100; });
  }

  /* ---------------------------------------------------------------
     Sparkles canvas (hero)
  --------------------------------------------------------------- */
  var canvas = $(".hero__sparkles");
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, parts = [];
    var colors = ["#cf5b81", "#c9a27c", "#ffffff", "#f29bb7"];
    function resize() {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(70, W / 18));
      parts = [];
      for (var i = 0; i < count; i++) parts.push(newPart(true));
    }
    function newPart(anywhere) {
      return {
        x: Math.random() * W,
        y: anywhere ? Math.random() * H : H + 10,
        r: Math.random() * 2.2 + 0.6,
        vy: -(Math.random() * 0.35 + 0.12),
        vx: (Math.random() - 0.5) * 0.2,
        a: Math.random() * Math.PI * 2,
        c: colors[(Math.random() * colors.length) | 0],
        star: Math.random() < 0.22
      };
    }
    function drawStar(x, y, r) {
      ctx.beginPath();
      ctx.moveTo(x, y - r * 2.6);
      ctx.quadraticCurveTo(x, y, x + r * 2.6, y);
      ctx.quadraticCurveTo(x, y, x, y + r * 2.6);
      ctx.quadraticCurveTo(x, y, x - r * 2.6, y);
      ctx.quadraticCurveTo(x, y, x, y - r * 2.6);
      ctx.fill();
    }
    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(canvas);
    }
    function frame() {
      if (visible) {
        ctx.clearRect(0, 0, W, H);
        parts.forEach(function (p, i) {
          p.x += p.vx; p.y += p.vy; p.a += 0.03;
          if (p.y < -10) parts[i] = newPart(false);
          ctx.globalAlpha = 0.35 + Math.sin(p.a) * 0.35;
          ctx.fillStyle = p.c;
          if (p.star) drawStar(p.x, p.y, p.r);
          else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
        });
      }
      requestAnimationFrame(frame);
    }
    resize();
    window.addEventListener("resize", resize);
    frame();
  }

  /* ---------------------------------------------------------------
     Gallery: auto-scrolling, draggable rail
  --------------------------------------------------------------- */
  var rail = $(".gallery__rail");
  var track = $(".gallery__track");
  if (rail && track) {
    var originals = $$(".gallery__item", track);
    originals.forEach(function (item) {
      var clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.tabIndex = -1;
      track.appendChild(clone);
    });
    var pos = 0, speed = reduceMotion ? 0 : 0.45, dragging = false, startX = 0, startPos = 0, moved = 0, hover = false, velocity = 0, lastX = 0;
    function half() { return track.scrollWidth / 2; }
    function wrap() { var h = half(); if (pos <= -h) pos += h; if (pos > 0) pos -= h; }
    rail.addEventListener("pointerenter", function () { hover = true; });
    rail.addEventListener("pointerleave", function () { hover = false; });
    rail.addEventListener("pointerdown", function (e) {
      dragging = true; moved = 0; startX = lastX = e.clientX; startPos = pos; velocity = 0;
      rail.classList.add("is-dragging");
    });
    window.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 5 && !rail.hasPointerCapture(e.pointerId)) { try { rail.setPointerCapture(e.pointerId); } catch (err) {} }
      velocity = e.clientX - lastX; lastX = e.clientX;
      pos = startPos + dx; wrap();
    });
    window.addEventListener("pointerup", function () {
      if (!dragging) return;
      dragging = false; rail.classList.remove("is-dragging");
    });
    (function loop() {
      if (!dragging) {
        velocity *= 0.94;
        pos += velocity - (hover && finePointer ? speed * 0.25 : speed);
        wrap();
      }
      track.style.transform = "translate3d(" + pos.toFixed(2) + "px,0,0)";
      requestAnimationFrame(loop);
    })();

    /* Lightbox */
    var lb = $(".lightbox"), lbImg = $(".lightbox__img"), idx = 0;
    var srcs = originals.map(function (b) { var i = $("img", b); return { src: i.getAttribute("src"), alt: i.alt }; });
    function show(i) {
      idx = (i + srcs.length) % srcs.length;
      lbImg.style.opacity = 0;
      setTimeout(function () { lbImg.src = srcs[idx].src; lbImg.alt = srcs[idx].alt; lbImg.style.opacity = 1; }, 150);
    }
    window.openLightbox = function (i) { show(i); lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false"); body.style.overflow = "hidden"; };
    $$(".gallery__item", track).forEach(function (b, i) {
      b.addEventListener("click", function (e) {
        if (moved > 6) { e.preventDefault(); return; }
        window.openLightbox(i % srcs.length);
      });
    });
    $(".lightbox__close").addEventListener("click", closeLightbox);
    $(".lightbox__nav--prev").addEventListener("click", function () { show(idx - 1); });
    $(".lightbox__nav--next").addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
    var tsx = 0;
    lb.addEventListener("touchstart", function (e) { tsx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - tsx;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "ArrowRight") show(idx + 1);
      if (e.key === "ArrowLeft") show(idx - 1);
    });
  }

  function closeLightbox() {
    var lb = $(".lightbox");
    if (!lb || !lb.classList.contains("is-open")) return;
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    body.style.overflow = "";
  }
})();
