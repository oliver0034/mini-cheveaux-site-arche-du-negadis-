/* L'Arche du Négadis — JS principal */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Nav: scroll opacity ---- */
  const nav = document.querySelector('.site-nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---- Mobile nav ---- */
  const burger  = document.querySelector('.nav-burger');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileClose = document.querySelector('.mobile-close');
  if (burger && mobileNav) {
    burger.addEventListener('click', () => mobileNav.classList.add('open'));
    mobileClose?.addEventListener('click', () => mobileNav.classList.remove('open'));
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => mobileNav.classList.remove('open'));
    });
    mobileNav.querySelectorAll('.mobile-acc-btn').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.mobile-accordion').classList.toggle('open'));
    });
  }

  /* ---- Active nav link ---- */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .drop-item').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href.includes(currentPath)) link.classList.add('active');
  });

  /* ---- Hero image : reveal + scroll + mouse parallax ---- */
  const hero       = document.querySelector('.hero');
  const heroBg     = document.querySelector('.hero-bg');
  const heroBgImg  = document.querySelector('.hero-bg img');

  if (heroBgImg) {
    const markLoaded = () => {
      heroBgImg.classList.add('loaded');
      // After the initial reveal transition, switch to fast transitions so
      // scroll-driven translate updates remain smooth.
      setTimeout(() => heroBgImg.classList.add('settled'), 3000);
    };
    heroBgImg.addEventListener('load', markLoaded);
    if (heroBgImg.complete) markLoaded();

    // Scroll parallax via CSS variable (won't clobber scale/filter)
    window.addEventListener('scroll', () => {
      heroBgImg.style.setProperty('--py', `${window.scrollY * 0.25}px`);
    }, { passive: true });
  }

  /* ---- Hero mouse parallax ---- */
  if (hero && heroBg && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let rafId = null;
    hero.addEventListener('mousemove', (e) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width  - 0.5);
        const y = ((e.clientY - r.top)  / r.height - 0.5);
        hero.style.setProperty('--mx', x.toFixed(3));
        hero.style.setProperty('--my', y.toFixed(3));
        rafId = null;
      });
    });
    hero.addEventListener('mouseleave', () => {
      hero.style.setProperty('--mx', 0);
      hero.style.setProperty('--my', 0);
    });
  }

  /* ---- Hero H1 : split into words for staggered reveal ---- */
  const heroH1 = document.querySelector('.hero h1');
  if (heroH1) {
    let idx = 0;
    const wrap = (source, target) => {
      source.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          const parts = node.textContent.split(/(\s+)/);
          parts.forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) {
              target.appendChild(document.createTextNode(p));
            } else {
              const span = document.createElement('span');
              span.className = 'h-word';
              span.style.setProperty('--i', idx++);
              span.textContent = p;
              target.appendChild(span);
            }
          });
        } else if (node.nodeName === 'BR') {
          target.appendChild(node.cloneNode());
        } else if (node.nodeName === 'EM') {
          const em = document.createElement('em');
          wrap(node, em);
          target.appendChild(em);
        } else {
          target.appendChild(node.cloneNode(true));
        }
      });
    };
    const frag = document.createDocumentFragment();
    wrap(heroH1, frag);
    heroH1.innerHTML = '';
    heroH1.appendChild(frag);
    requestAnimationFrame(() => heroH1.classList.add('reveal'));
  }

  /* ---- Hero CTA stagger ---- */
  document.querySelectorAll('.hero-cta > *').forEach((el, i) => {
    el.style.setProperty('--j', i);
  });

  /* ---- Hero gold sparks ---- */
  if (hero && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const sparks = document.createElement('div');
    sparks.className = 'hero-sparks';
    sparks.setAttribute('aria-hidden', 'true');
    const count = 14;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      const size = 2 + Math.random() * 3;
      s.style.setProperty('--x',     `${Math.random() * 100}%`);
      s.style.setProperty('--sz',    `${size}px`);
      s.style.setProperty('--dur',   `${10 + Math.random() * 10}s`);
      s.style.setProperty('--delay', `${Math.random() * 12}s`);
      s.style.setProperty('--drift', `${(Math.random() - 0.5) * 80}px`);
      sparks.appendChild(s);
    }
    hero.appendChild(sparks);
  }

  /* ---- Scroll reveal ---- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => observer.observe(el));
  }

  /* ---- Fiche: thumbnail gallery ---- */
  const thumbs = document.querySelectorAll('.fiche-thumb');
  const mainImg = document.querySelector('.fiche-main-img img');
  if (thumbs.length && mainImg) {
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const src = thumb.querySelector('img').src;
        mainImg.style.opacity = '0';
        setTimeout(() => {
          mainImg.src = src;
          mainImg.style.opacity = '1';
        }, 200);
        thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });
    mainImg.style.transition = 'opacity .2s ease';
    thumbs[0]?.classList.add('active');
  }

  /* ---- Contact form (basic) ---- */
  const form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('[type=submit]');
      btn.textContent = 'Message envoyé ✓';
      btn.disabled = true;
      btn.style.opacity = '.7';
    });
  }

  /* ---- FAQ Accordion ---- */
  document.querySelectorAll('.faq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(el => {
        el.classList.remove('open');
        el.querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---- Page transitions ---- */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') ||
          href.startsWith('mailto') || href.startsWith('tel') || href.startsWith('//')) return;
      link.addEventListener('click', e => {
        e.preventDefault();
        document.body.classList.add('page-exiting');
        setTimeout(() => { window.location.href = href; }, 290);
      });
    });
  }

  /* ---- Count-up animation pour stats ---- */
  const statNums = document.querySelectorAll('.stat-num');
  if (statNums.length) {
    const countObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const raw = el.textContent.trim();
        const m = raw.match(/^(\d+(?:\.\d+)?)(.*)/);
        if (!m) return;
        const end = parseFloat(m[1]);
        const suffix = m[2];
        const stat = el.closest('.stat');
        if (stat) stat.classList.add('counting');
        const t0 = performance.now();
        const dur = 1100;
        const tick = now => {
          const p = Math.min((now - t0) / dur, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * ease) + suffix;
          if (p < 1) requestAnimationFrame(tick);
          else {
            el.textContent = raw;
            if (stat) setTimeout(() => stat.classList.remove('counting'), 500);
          }
        };
        requestAnimationFrame(tick);
        countObs.unobserve(el);
      });
    }, { threshold: 0.6 });
    statNums.forEach(el => countObs.observe(el));
  }

  /* ---- Stats row : stagger reveal ---- */
  document.querySelectorAll('.stats-row').forEach(row => {
    row.querySelectorAll('.stat').forEach((s, i) => s.style.setProperty('--stagger', i));
    new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
    }, { threshold: 0.2 }).observe(row);
  });

  /* ---- Timeline entries stagger (origine page) ---- */
  document.querySelectorAll('.timeline-entry').forEach((el, i) => {
    el.style.setProperty('--ti', i);
    new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
    }, { threshold: 0.15 }).observe(el);
  });

});
