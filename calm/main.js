/* ==========================================================================
   Decode Nation — Direction 1 · Calm Editorial — behaviour
   Scroll reveals · contact form
   (Portrait B&W → colour hover is pure CSS, gated on (hover: hover).)
   ========================================================================== */

/* Form backend not confirmed yet. Set to a POST URL (Formspree, Netlify
   function, …) and the fetch path takes over; empty = mailto fallback. */
var FORM_ENDPOINT = '';

(function () {
  'use strict';

  var CONTACT_EMAIL = 'contact@decodenation.com';
  var SUCCESS_LABEL = 'Thank you — we’ll be in touch';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------- scroll reveals */

  function initReveals() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

    function show(el) { el.classList.add('is-shown'); }

    /* Content already in (or near) the viewport is never hidden: mark it
       shown before html.js switches the hiding CSS on. */
    nodes.forEach(function (el) {
      if (el.getBoundingClientRect().top <= window.innerHeight * 0.9) show(el);
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      nodes.forEach(show);
      document.documentElement.classList.add('js');
      return;
    }

    document.documentElement.classList.add('js');

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          show(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.06 });

    nodes.forEach(function (el) {
      if (!el.classList.contains('is-shown')) io.observe(el);
    });

    /* Safety net: whatever happens, nothing stays invisible. */
    setTimeout(function () {
      nodes.forEach(show);
      io.disconnect();
    }, 1500);
  }

  /* --------------------------------------------------------- contact form */

  function initContactForm() {
    var form = document.querySelector('.contact-form');
    if (!form) return;

    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn.querySelector('.btn-submit__label');
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
        if (input.value.trim() || input.getAttribute('aria-invalid') === 'true') validate(field);
      });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true' && input.value.trim()) setError(field, '');
      });
    });

    function getIntent() {
      var checked = form.querySelector('input[name="intent"]:checked');
      return checked ? checked.value : '';
    }

    function succeed() {
      form.dataset.sent = 'true';
      submitLabel.textContent = SUCCESS_LABEL;
      submitBtn.disabled = true;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.dataset.sent === 'true' || form.dataset.pending === 'true') return;

      /* Honeypot: bots fill every field. Pretend success, send nothing. */
      if (form.elements.website && form.elements.website.value) {
        succeed();
        return;
      }

      var nameOk = validate('name');
      var messageOk = validate('message');
      if (!nameOk || !messageOk) {
        status.textContent = '';
        form.elements[nameOk ? 'message' : 'name'].focus();
        return;
      }

      var data = {
        name: form.elements.name.value.trim(),
        organization: form.elements.organization.value.trim(),
        intent: getIntent(),
        message: form.elements.message.value.trim()
      };

      if (FORM_ENDPOINT) {
        form.dataset.pending = 'true';
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
        submitLabel.textContent = 'Sending…';
        status.textContent = '';

        fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        }).then(function (res) {
          if (!res.ok) throw new Error('Request failed: ' + res.status);
          form.dataset.pending = 'false';
          submitBtn.removeAttribute('aria-busy');
          succeed();
          status.textContent = 'Your message has been sent.';
        }).catch(function () {
          form.dataset.pending = 'false';
          submitBtn.removeAttribute('aria-busy');
          submitBtn.disabled = false;
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

      var subject = 'Decode Nation — ' + (data.intent ? data.intent + ' enquiry' : 'Enquiry');

      window.location.href = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      succeed();
      status.textContent = 'Your mail client should open with the message ready to send.';
    });
  }

  /* ------------------------------------------------------------------ boot */

  initReveals();
  initContactForm();
})();
