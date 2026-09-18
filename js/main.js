/**
 * Godrej Neopolis — Main JavaScript
 * Handles: mobile menu, FAQ accordion, scroll reveals, parallax, form, header shadow
 */

(function () {
  'use strict';

  // ========== CONFIG: Centralized Project Config ==========
  const CONFIG = {
    phone: '+919032782348',
    whatsapp: '919032782348',
    brochureUrl: './assets/downloads/godrej-neopolis-brochure.pdf',
    formEndpoint: 'https://formspree.io/f/xqeadorl',
    googleSheetEndpoint: 'https://script.google.com/macros/s/AKfycbyOx6e7OsuH7eIOTzl84mGhBUwynFlsnDwtuws-zQn_JPc8G5fXxjQTK4lKPv5n3-c6/exec',
  };

  // ========== DOM refs ==========
  const header = document.getElementById('site-header');
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const leadForm = document.getElementById('lead-form');
  const formSuccess = document.getElementById('form-success');
  const bookVisitBtn = document.getElementById('book-visit-btn');

  // ========== Mobile menu ==========
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = !mobileMenu.classList.contains('hidden');
      mobileMenu.classList.toggle('hidden');
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ========== Header shadow on scroll ==========
  function updateHeader() {
    if (!header) return;
    header.classList.toggle('shadow-md', window.scrollY > 20);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // ========== Smooth scroll offset for fixed header ==========
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const headerH = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ========== Scroll reveal (Intersection Observer) ==========
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // ========== Subtle hero parallax ==========
  const parallaxEl = document.querySelector('[data-parallax]');
  if (parallaxEl && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const rate = parseFloat(parallaxEl.dataset.parallax) || 0.15;
    window.addEventListener(
      'scroll',
      () => {
        const scrolled = window.scrollY;
        if (scrolled < window.innerHeight) {
          parallaxEl.style.transform = `translate3d(0, ${scrolled * rate}px, 0)`;
        }
      },
      { passive: true }
    );
  }

  // ========== FAQ accordion ==========
  document.querySelectorAll('.faq-item').forEach((item) => {
    const trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      document.querySelectorAll('.faq-item.is-open').forEach((openItem) => {
        openItem.classList.remove('is-open');
        openItem.querySelector('.faq-trigger')?.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Open first FAQ by default for SEO preview
  const firstFaq = document.querySelector('.faq-item');
  if (firstFaq) {
    firstFaq.classList.add('is-open');
    firstFaq.querySelector('.faq-trigger')?.setAttribute('aria-expanded', 'true');
  }

  // ========== Lead form ==========
  if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = leadForm.name.value.trim();
      const phone = leadForm.phone.value.trim();

      if (!name || !phone) {
        alert('Please enter your name and phone number.');
        return;
      }

      const payload = {
        name,
        phone,
        email: leadForm.email.value.trim(),
        unit: leadForm.unit.value,
        message: leadForm.message.value.trim(),
        source: 'Godrej Neopolis Website',
        page: window.location.href,
        timestamp: new Date().toISOString(),
      };

      try {
        const requests = [];

        // 1. Submit to Formspree
        if (CONFIG.formEndpoint) {
          requests.push(
            fetch(CONFIG.formEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }).catch((err) => console.error('Formspree submission error:', err))
          );
        }

        // 2. Submit to Google Sheet Endpoint
        if (CONFIG.googleSheetEndpoint) {
          const formBody = new URLSearchParams();
          Object.keys(payload).forEach((key) => {
            formBody.append(key, payload[key] || '');
          });

          requests.push(
            fetch(CONFIG.googleSheetEndpoint, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: formBody.toString(),
            }).catch((err) => console.error('Google Sheet submission error:', err))
          );
        }

        await Promise.allSettled(requests);

        // Track conversion — connect Meta Pixel / Google Ads gtag here
        if (typeof gtag === 'function') {
          gtag('event', 'generate_lead', { event_category: 'form', event_label: payload.unit || 'general' });
        }
        if (typeof fbq === 'function') {
          fbq('track', 'Lead');
        }

        leadForm.classList.add('hidden');
        formSuccess?.classList.remove('hidden');
        formSuccess?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (err) {
        console.error('Form submission error:', err);
        alert('Thank you! We have received your enquiry for Godrej Neopolis and will contact you shortly.');
        leadForm.classList.add('hidden');
        formSuccess?.classList.remove('hidden');
      }
    });
  }

  if (bookVisitBtn && leadForm) {
    bookVisitBtn.addEventListener('click', () => {
      const msg = leadForm.message;
      if (msg && !msg.value.includes('site visit')) {
        msg.value = 'I would like to book a site visit for Godrej Neopolis. ' + msg.value;
      }
      leadForm.name.focus();
      leadForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // ========== Brochure download tracking ==========
  document.querySelectorAll('[data-cta*="brochure"], a[download]').forEach((el) => {
    el.addEventListener('click', () => {
      if (typeof gtag === 'function') {
        gtag('event', 'file_download', { event_category: 'brochure', event_label: 'godrej-neopolis-brochure' });
      }
    });
  });

  // ========== CTA click tracking ==========
  document.querySelectorAll('[data-cta]').forEach((el) => {
    el.addEventListener('click', () => {
      const label = el.getAttribute('data-cta');
      if (typeof gtag === 'function') {
        gtag('event', 'click', { event_category: 'cta', event_label: label });
      }
    });
  });

})();

