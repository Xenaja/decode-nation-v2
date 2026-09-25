/* ==========================================================================
   Decode Nation — Direction 3 · Manifesto — behaviour
   Scroll reveal · contact form (endpoint or mailto fallback)
   ========================================================================== */

/* No form backend has been confirmed by the client yet. Set this to a POST
   URL (Formspree, Netlify function, …) and the fetch path takes over; while
   it is empty, a valid submit opens the visitor's mail client instead. */
var FORM_ENDPOINT = '';

(function () {
  'use strict';

  var CONTACT_EMAIL = 'contact@decodenation.com';
  var LABEL_IDLE = 'Send →';
  var LABEL_PENDING = 'Sending…';
  var LABEL_SENT = 'Thank you — we’ll be in touch';

  var root = document.documentElement;
  root.classList.add('js');

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------------- scroll reveal */

  function initReveal() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!nodes.length) return;

    function show(el) { el.classList.add('is-shown'); }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      nodes.forEach(show);
      return;
    }

    /* Content already on screen is never hidden: mark it shown in the same
       task the .js class was added, so there is no flash or transition. */
    nodes.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) show(el);
    });

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

    /* Safety net: nothing stays invisible, whatever happens. */
    setTimeout(function () {
      nodes.forEach(show);
      io.disconnect();
    }, 1500);
  }

  /* ---------------------------------------------------------- contact form */

  function initContactForm() {
    var form = document.querySelector('.contact-form');
    if (!form) return;

    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn.querySelector('.btn__label');
    var status = form.querySelector('.form-status');

    var messages = {
      name: 'Please tell us your name.',
      message: 'Please add a short message.'
    };

    function field(name) { return form.elements[name]; }

    function setError(name, text) {
      var input = field(name);
      var slot = document.getElementById('err-' + name);
      if (!input || !slot) return;
      if (text) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
      slot.textContent = text || '';
    }

    function validate(name) {
      var ok = !!(field(name).value || '').trim();
      setError(name, ok ? '' : messages[name]);
      return ok;
    }

    function setStatus(text, isError) {
      status.textContent = text || '';
      status.classList.toggle('is-error', !!isError);
    }

    Object.keys(messages).forEach(function (name) {
      var input = field(name);
      /* validate on blur once the visitor has typed something, and clear the
         error as soon as the field becomes valid again */
      input.addEventListener('blur', function () {
        if (input.dataset.touched === 'true') validate(name);
      });
      input.addEventListener('input', function () {
        input.dataset.touched = 'true';
        if (input.getAttribute('aria-invalid') === 'true') validate(name);
      });
    });

    function succeed() {
      form.dataset.sent = 'true';
      submitBtn.removeAttribute('aria-busy');
      submitBtn.disabled = true;
      submitLabel.textContent = LABEL_SENT;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.dataset.sent === 'true' || submitBtn.disabled) return;

      /* honeypot: bots fill every field — pretend success, send nothing */
      if (field('website') && field('website').value) {
        succeed();
        return;
      }

      var okName = validate('name');
      var okMessage = validate('message');
      if (!okName || !okMessage) {
        setStatus('Please fill in the highlighted fields.', true);
        field(okName ? 'message' : 'name').focus();
        return;
      }
      setStatus('');

      var checked = form.querySelector('input[name="intent"]:checked');
      var data = {
        name: field('name').value.trim(),
        organization: field('organization').value.trim(),
        intent: checked ? checked.value : '',
        message: field('message').value.trim()
      };

      if (FORM_ENDPOINT) {
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
        submitLabel.textContent = LABEL_PENDING;
        setStatus('Sending your message…');

        fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        }).then(function (res) {
          if (!res.ok) throw new Error('Form endpoint responded ' + res.status);
          succeed();
          setStatus('Message sent. Thank you — we’ll be in touch.');
        }).catch(function (err) {
          if (window.console) console.error('[contact form]', err);
          submitBtn.disabled = false;
          submitBtn.removeAttribute('aria-busy');
          submitLabel.textContent = LABEL_IDLE;
          setStatus('Something went wrong. Please try again or email ' + CONTACT_EMAIL + '.', true);
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
      setStatus('Your mail client should open with the message ready to send.');
    });
  }

  initReveal();
  initContactForm();
})();
