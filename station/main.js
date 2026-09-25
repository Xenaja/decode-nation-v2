/* ==========================================================================
   Decode Nation — Direction 2 · Station System
   Rail scroll-spy · scroll reveal · contact form · review switcher
   ========================================================================== */

/* No form endpoint has been supplied by the client yet. Until one is,
   a validated submit falls back to the visitor's mail client. Set this to a
   POST URL (Formspree, a serverless function, …) and the fetch path takes over. */
var FORM_ENDPOINT = '';

(function () {
  'use strict';

  var CONTACT_EMAIL = 'contact@decodenation.com';
  var SENT_LABEL = 'Thank you — we’ll be in touch';

  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function toArray(list) { return Array.prototype.slice.call(list); }

  /* ------------------------------------------------------ rail scroll-spy */
  /* Active section = the last [data-sec] whose top is above 45% of the
     viewport (hero counts as "top", which has no rail item). */

  var sections = toArray(document.querySelectorAll('[data-sec]'));
  var railLinks = toArray(document.querySelectorAll('[data-rail]'));
  var currentSec = undefined;

  function spy() {
    var cur = null;
    var line = window.innerHeight * 0.45;
    sections.forEach(function (s) {
      if (s.getBoundingClientRect().top < line) cur = s.getAttribute('data-sec');
    });
    if (cur === currentSec) return;
    currentSec = cur;
    railLinks.forEach(function (a) {
      if (a.getAttribute('data-rail') === cur) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  /* -------------------------------------------------------- scroll reveal */

  var revealNodes = toArray(document.querySelectorAll('[data-reveal]'));

  function show(el) { el.classList.add('is-shown'); }

  function revealInView() {
    revealNodes.forEach(function (el) {
      if (!el.classList.contains('is-shown') &&
          el.getBoundingClientRect().top < window.innerHeight * 0.9) show(el);
    });
  }

  function initReveals() {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealNodes.forEach(show);
      return;
    }

    /* Content already on screen is shown synchronously, before first paint,
       so nothing above the fold ever flashes hidden. */
    revealInView();

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          show(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.06 });

    revealNodes.forEach(function (el) {
      if (!el.classList.contains('is-shown')) io.observe(el);
    });

    /* Safety net: whatever happens, nothing stays invisible. */
    setTimeout(function () { revealNodes.forEach(show); }, 1500);
  }

  /* --------------------------------------------------------- contact form */

  function initContactForm() {
    var form = document.querySelector('.contact-form');
    if (!form) return;

    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn.querySelector('.submit__label');
    var status = form.querySelector('.form-status');

    var messages = {
      name: 'Please tell us your name.',
      message: 'Please add a short message.'
    };

    function setError(field, message) {
      var input = form.elements[field];
      var slot = form.querySelector('[data-error-for="' + field + '"]');
      if (!input || !slot) return;
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
      slot.textContent = message || '';
    }

    function validate(field) {
      var ok = !!(form.elements[field].value || '').trim();
      setError(field, ok ? '' : messages[field]);
      return ok;
    }

    Object.keys(messages).forEach(function (field) {
      var input = form.elements[field];
      input.addEventListener('blur', function () {
        /* Only complain on blur once the visitor has typed something or
           already tried to submit — tabbing through shouldn't shout. */
        if (input.dataset.touched === 'true' || form.dataset.attempted === 'true') validate(field);
      });
      input.addEventListener('input', function () {
        input.dataset.touched = 'true';
        if (input.getAttribute('aria-invalid') === 'true') validate(field);
      });
    });

    function checkedIntent() {
      var el = form.querySelector('input[name="intent"]:checked');
      return el ? el.value : '';
    }

    function succeed() {
      form.dataset.sent = 'true';
      submitLabel.textContent = SENT_LABEL;
      submitBtn.disabled = true;
      submitBtn.removeAttribute('aria-busy');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.dataset.sent === 'true' || form.dataset.pending === 'true') return;
      form.dataset.attempted = 'true';
      status.textContent = '';

      var nameOk = validate('name');
      var messageOk = validate('message');
      if (!nameOk || !messageOk) {
        form.elements[nameOk ? 'message' : 'name'].focus();
        status.textContent = 'Please fill in the highlighted fields.';
        return;
      }

      /* Honeypot filled → a bot. Pretend success, send nothing. */
      if ((form.elements.website.value || '').trim()) {
        succeed();
        return;
      }

      var data = {
        name: form.elements.name.value.trim(),
        organization: (form.elements.organization.value || '').trim(),
        intent: checkedIntent(),
        message: form.elements.message.value.trim()
      };

      if (FORM_ENDPOINT) {
        form.dataset.pending = 'true';
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
        submitLabel.textContent = 'Sending…';
        status.textContent = 'Sending your message…';

        fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        }).then(function (res) {
          if (!res.ok) throw new Error('Request failed: ' + res.status);
          form.dataset.pending = 'false';
          succeed();
          status.textContent = 'Message sent. ' + SENT_LABEL + '.';
        }).catch(function () {
          form.dataset.pending = 'false';
          submitBtn.disabled = false;
          submitBtn.removeAttribute('aria-busy');
          submitLabel.textContent = 'Send';
          status.textContent = 'Something went wrong. Please try again or email ' + CONTACT_EMAIL + '.';
        });
        return;
      }

      /* No endpoint configured yet — hand the message to the mail client. */
      var body = [
        'Name: ' + data.name,
        'Organization: ' + (data.organization || '—'),
        'Interested in: ' + (data.intent || '—'),
        '',
        data.message
      ].join('\n');

      var subject = 'Decode Nation — ' + (data.intent ? data.intent + ' enquiry' : 'enquiry');

      window.location.href = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      succeed();
      status.textContent = 'Your mail client should open with the message ready to send.';
    });
  }

  /* ------------------------------------------------ review-only switcher */
  /* On phones, tuck the switcher away while the submit button is on screen
     so it never sits on top of it. */

  function initSwitcher() {
    var sw = document.querySelector('.variant-switch');
    var submit = document.querySelector('.contact-form .submit');
    if (!sw || !submit || !('IntersectionObserver' in window)) return;

    var narrow = window.matchMedia('(max-width: 760px)');
    var submitVisible = false;

    function update() { sw.classList.toggle('is-tucked', narrow.matches && submitVisible); }

    new IntersectionObserver(function (entries) {
      submitVisible = entries[0].isIntersecting;
      update();
    }).observe(submit);

    if (narrow.addEventListener) narrow.addEventListener('change', update);
    else if (narrow.addListener) narrow.addListener(update);
  }

  /* ----------------------------------------------------------------- boot */

  initReveals();
  initContactForm();
  initSwitcher();

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      spy();
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  spy();
})();
