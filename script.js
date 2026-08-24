/**
 * Page behaviour: theme, headroom header, scroll reveals, back-to-top, tag
 * links, mobile menu, résumé dialog, copy buttons, clock and contact form.
 *
 * A classic script wrapped in one IIFE, not an ES module: Chrome refuses
 * <script type="module"> over file://, which would leave the page inert when
 * opened straight off disk.
 *
 * Every block degrades — a missing hook element makes it do nothing rather
 * than throw and kill the handlers registered after it.
 */

(function () {
  'use strict';

  var root = document.getElementById('root');
  if (!root) return;

  var themeRoot = root.firstElementChild;
  var page = themeRoot ? themeRoot.lastElementChild : null;
  var splash = document.getElementById('splash');
  if (!themeRoot || !page) return;

  // prefers-reduced-motion is deliberately not honoured: gating on it made the
  // page read as broken rather than calm. Do not add a branch for it.

  /* localStorage throws outright — not merely returns empty — in some file://
     and private-mode configurations, and an uncaught throw here would run
     before every other feature. */
  function readStore(key) {
    try {
      var item = window.localStorage.getItem(key);
      return item === null ? null : JSON.parse(item);
    } catch (err) {
      return null;
    }
  }

  function writeStore(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* preference just will not survive a reload */
    }
  }

  // Runs immediately rather than in start(), so the splash is themed too.
  (function theme() {
    var toggle = document.getElementById('theme-toggle');
    var mark = document.getElementById('theme-emoji');
    var emoji = window.__emoji || function (text) { return text; };
    var stored = readStore('isDark');
    var prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored === null ? prefersDark : stored === true;

    function apply() {
      themeRoot.className = isDark ? 'dark-mode' : '';
      if (mark) mark.innerHTML = emoji(isDark ? '🌜' : '☀️');
      if (!toggle) return;
      toggle.checked = isDark;
      toggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    }

    apply();

    if (!toggle) return;
    toggle.addEventListener('change', function () {
      isDark = !isDark;
      apply();
      writeStore('isDark', isDark);
    });
  })();

  /* The header unpins on the way down and snaps back on the way up. The
     wrapper carries the header's measured height so the page does not jump
     when the inner element goes `position: fixed`. */
  function headroom() {
    var wrapper = document.getElementById('headroom-wrapper');
    var inner = document.getElementById('headroom');
    if (!wrapper || !inner) return;

    var PIN_START = 0;
    var UP_TOLERANCE = 5;
    var DOWN_TOLERANCE = 0;

    var state = 'unfixed';
    var animation = false;
    var lastKnownScrollY = 0;
    var height = 0;
    var ticking = false;

    function measure() {
      height = inner.offsetHeight;
      wrapper.style.height = height + 'px';
    }

    function render(next, translateY, anim) {
      state = next;
      animation = anim;
      inner.className = 'headroom headroom--' + next + (anim ? ' headroom--scrolled' : '');
      inner.style.transform = 'translate3D(0, ' + translateY + ', 0)';
    }

    function update() {
      var currentScrollY = window.pageYOffset;
      var direction = currentScrollY >= lastKnownScrollY ? 'down' : 'up';
      var distance = Math.abs(currentScrollY - lastKnownScrollY);
      var fixedOrUnfixed = state === 'pinned' || state === 'unfixed';

      if (currentScrollY <= PIN_START && state !== 'unfixed') {
        render('unfixed', '0', false);
      } else if (currentScrollY <= height && direction === 'down' && state === 'unfixed') {
        /* still inside the header on the way down — carry on */
      } else if (
        currentScrollY > height + PIN_START &&
        direction === 'down' &&
        state === 'unfixed'
      ) {
        // The snap: jump to -100% with no transition, or the header would
        // visibly fly upward the first time it leaves.
        render('unpinned', '-100%', false);
      } else if (
        direction === 'down' &&
        fixedOrUnfixed &&
        currentScrollY > height + PIN_START &&
        distance > DOWN_TOLERANCE
      ) {
        render('unpinned', '-100%', true);
      } else if (direction === 'up' && distance > UP_TOLERANCE && !fixedOrUnfixed) {
        render('pinned', '0', true);
      } else if (direction === 'up' && currentScrollY <= height && !fixedOrUnfixed) {
        render('pinned', '0', true);
      }

      lastKnownScrollY = currentScrollY;
    }

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener(
      'scroll',
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          update();
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  // Fires at 20% visibility. An element taller than the viewport can never
  // reach that, so it counts as arrived as soon as any of it shows. With no
  // IntersectionObserver everything is shown rather than left at opacity 0.
  function reveal() {
    var items = Array.prototype.slice.call(page.querySelectorAll('.reveal'));
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var tallerThanViewport = entry.boundingClientRect.height > window.innerHeight;
          if (entry.intersectionRatio >= 0.2 || tallerThanViewport) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: [0, 0.2] }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  // Toggled through `visibility` rather than `display` so it never reflows.
  function backToTop() {
    var button = document.getElementById('topButton');
    if (!button) return;

    function update() {
      button.style.visibility =
        document.body.scrollTop > 20 || document.documentElement.scrollTop > 20
          ? 'visible'
          : 'hidden';
    }

    window.addEventListener('scroll', update, { passive: true });
    update();

    button.addEventListener('click', function () {
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    });
  }

  // Only tags given a URL are clickable; the rest are labels.
  function tagLinks() {
    page.addEventListener('click', function (event) {
      var tag = event.target.closest('[data-url]');
      if (!tag) return;
      // `noopener` stops the opened page holding a live window.opener that
      // could navigate this tab. Browsers honouring it return null, hence the
      // guard before focus().
      var win = window.open(tag.getAttribute('data-url'), '_blank', 'noopener,noreferrer');
      if (win) win.focus();
    });
  }

  // The menu itself is pure CSS. This only closes it once a destination is
  // chosen, so the open panel does not cover the section just jumped to.
  function mobileMenu() {
    var checkbox = document.getElementById('menu-btn');
    var menu = page.querySelector('.header .menu');
    if (!checkbox || !menu) return;

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a[href^="#"]')) checkbox.checked = false;
    });
  }

  // render.js builds the overlay only when its scene is available, so a missing
  // element here means the button is inert by design. The scene is mounted on
  // first open — a hidden container measures zero — and left running, because
  // destroying it per open would restart the loop mid-gesture.
  function resumeDialog() {
    var button = document.getElementById('resume-button');
    var dialog = document.getElementById('resume-dialog');
    if (!button || !dialog) return;

    var stage = dialog.querySelector('[data-scene]');
    var closer = dialog.querySelector('.resume-dialog-close');
    var mounted = false;

    /* Everything from here to open() enforces what `aria-modal="true"` only
       declares: the attribute is a statement to assistive technology, not a
       behaviour, so the focus trap, the background silencing and the scroll
       lock below are what actually make the dialog modal.

       Deliberately not the `inert` attribute, which would do all of it in one
       line but needs Chrome 102+ — this file is written to the same
       conservative baseline as the rest of the port. */
    var FOCUSABLE =
      'a[href], area[href], button:not([disabled]), input:not([disabled]), ' +
      'select:not([disabled]), textarea:not([disabled]), iframe, ' +
      '[tabindex]:not([tabindex="-1"])';

    // Visible focusable descendants, in document order. Currently just the
    // close button, but written as a list so adding a control to the panel
    // cannot silently break the trap.
    function focusables() {
      return Array.prototype.slice.call(dialog.querySelectorAll(FOCUSABLE)).filter(
        function (node) {
          return node.offsetWidth || node.offsetHeight || node.getClientRects().length;
        }
      );
    }

    /* Hides the page behind the dialog from assistive technology. Done sibling
       by sibling rather than on one ancestor, because the dialog is appended
       into `page` and marking that would hide the dialog too. Only elements
       this changed are restored, so one carrying its own aria-hidden keeps
       it. */
    var silenced = [];

    function silenceBackground() {
      silenced = [];
      Array.prototype.forEach.call(page.children, function (child) {
        if (child === dialog || child.hasAttribute('aria-hidden')) return;
        child.setAttribute('aria-hidden', 'true');
        silenced.push(child);
      });
    }

    function restoreBackground() {
      silenced.forEach(function (child) {
        child.removeAttribute('aria-hidden');
      });
      silenced = [];
    }

    // The padding replaces the scrollbar's width so the page does not jump
    // sideways when overflow goes hidden. Measured, not assumed: it is 0 on
    // overlay-scrollbar platforms and around 15px on Windows.
    function lockScroll() {
      var gap = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (gap > 0) document.body.style.paddingRight = gap + 'px';
    }

    function unlockScroll() {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    function open() {
      if (isOpen()) return;
      if (!mounted && window.__mountScene && stage) {
        mounted = window.__mountScene(stage.getAttribute('data-scene'), stage);
      }
      dialog.removeAttribute('hidden');
      button.setAttribute('aria-expanded', 'true');
      silenceBackground();
      lockScroll();
      if (closer) closer.focus();
    }

    function close() {
      if (!isOpen()) return;
      // Hide first, restore focus last. The focusin backstop below pulls focus
      // back into the dialog while it is open, so focusing the opener any
      // earlier would be undone immediately.
      dialog.setAttribute('hidden', '');
      button.setAttribute('aria-expanded', 'false');
      restoreBackground();
      unlockScroll();
      button.focus();
    }

    function isOpen() {
      return !dialog.hasAttribute('hidden');
    }

    // Tab off the last focusable element wraps to the first, Shift+Tab off the
    // first wraps to the last.
    dialog.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab') return;
      var items = focusables();
      if (!items.length) {
        event.preventDefault();
        return;
      }
      var first = items[0];
      var last = items[items.length - 1];
      var active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    });

    // Backstop for focus arriving where the keydown handler never sees it — a
    // backdrop click, or focus returning from the browser's own UI.
    document.addEventListener('focusin', function (event) {
      if (!isOpen() || dialog.contains(event.target)) return;
      var items = focusables();
      if (items.length) items[0].focus();
    });

    button.addEventListener('click', function (event) {
      event.preventDefault();
      open();
    });

    // An <a role="button"> gets no keyboard activation for free — a real
    // <button> would answer both of these on its own. Space is prevented
    // because its default on a focused element is to scroll the page.
    button.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;
      event.preventDefault();
      open();
    });

    // The backdrop and the close button both carry data-close.
    dialog.addEventListener('click', function (event) {
      if (event.target.closest('[data-close]')) close();
    });

    document.addEventListener('keydown', function (event) {
      if (!isOpen()) return;
      if (event.key === 'Escape' || event.key === 'Esc') close();
    });
  }

  /* ------------------------------------------------- copy to clipboard */
  function copyButtons() {
    var buttons = Array.prototype.slice.call(page.querySelectorAll('[data-copy]'));

    buttons.forEach(function (button) {
      var original = button.textContent;

      button.addEventListener('click', function () {
        var text = button.getAttribute('data-copy');

        function done() {
          button.textContent = 'Copied';
          window.setTimeout(function () {
            button.textContent = original;
          }, 1600);
        }

        // navigator.clipboard needs a secure context, which file:// is not, so
        // the execCommand path below is the one that runs when opened offline.
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else {
          fallback();
        }

        function fallback() {
          var field = document.createElement('textarea');
          field.value = text;
          field.setAttribute('readonly', '');
          field.style.position = 'fixed';
          field.style.opacity = '0';
          document.body.appendChild(field);
          field.select();
          try {
            document.execCommand('copy');
            done();
          } catch (err) {
            button.textContent = 'Press Ctrl+C';
          }
          document.body.removeChild(field);
        }
      });
    });
  }

  /* -------------------------------------------------------- local time */
  function localTime() {
    var el = document.getElementById('local-time');
    if (!el) return;

    function render() {
      try {
        el.textContent = new Date().toLocaleTimeString('en-GB', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch (err) {
        // Engines without full IANA zone data. Names the offset only: no city
        // is stated anywhere on this site.
        el.textContent = 'UTC+5:30';
      }
    }

    render();
    window.setInterval(render, 30000);
  }

  /* ------------------------------------------------------ contact form */
  function contactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var status = document.getElementById('form-status');

    function setError(input, message) {
      var field = input.closest('.contact-form-field');
      var slot = form.querySelector('[data-error-for="' + input.id + '"]');
      if (field) field.classList.toggle('has-error', Boolean(message));
      if (slot) slot.textContent = message || '';
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      return !message;
    }

    function validate() {
      var name = form.elements.name;
      var email = form.elements.email;
      var message = form.elements.message;

      var okName = setError(name, name.value.trim() ? '' : 'Please tell me your name.');
      var value = email.value.trim();
      var okEmail = setError(
        email,
        !value
          ? 'Please add an email address.'
          : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            ? ''
            : 'That does not look like an email address.'
      );
      var okMessage = setError(
        message,
        message.value.trim() ? '' : 'Please write a short message.'
      );

      return okName && okEmail && okMessage;
    }

    /* `contact.email` is empty by decision, so reading it alone would build
       'mailto:?subject=…' — a draft with no recipient. Falls back to the
       envelope entry in socialMedia: same config file, same inbox, cannot go
       stale independently. Returns '' if neither is set, which the caller
       treats as "cannot send". */
    function recipient() {
      var cfg = (window.portfolio && window.portfolio.contact) || {};
      if (cfg.email) return cfg.email;

      var social = (window.portfolio && window.portfolio.socialMedia) || {};
      var mail = (social.profiles || []).filter(function (profile) {
        return profile.network === 'mail';
      })[0];
      if (!mail) return '';
      // Either the handle or the href will do; the href needs its scheme and
      // any ?subject= the config might have put there stripped off.
      return mail.handle || String(mail.href || '').replace(/^mailto:/, '').split('?')[0];
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      if (!validate()) {
        var firstBad = form.querySelector('.has-error input, .has-error textarea');
        if (firstBad) firstBad.focus();
        if (status) status.textContent = '';
        return;
      }

      // No server behind this page: hand the message to the visitor's own mail
      // client rather than pretend to send it.
      var subject = 'Portfolio enquiry from ' + form.elements.name.value.trim();
      var body =
        form.elements.message.value.trim() +
        '\n\n—\n' +
        form.elements.name.value.trim() +
        '\n' +
        form.elements.email.value.trim();

      var address = recipient();

      // Only reachable if the config carries no address anywhere. Better to
      // say so than open a blank draft the visitor thinks was addressed.
      if (!address) {
        if (status) {
          status.textContent =
            'No address is configured, so this cannot be sent. Please use one of the links above.';
        }
        return;
      }

      window.location.href =
        'mailto:' +
        address +
        '?subject=' +
        encodeURIComponent(subject) +
        '&body=' +
        encodeURIComponent(body);

      if (status) status.textContent = 'Opening your mail client…';
    });

    // Clear an error as soon as the visitor starts fixing it.
    form.addEventListener('input', function (event) {
      var target = event.target;
      if (target.matches('input, textarea') && target.closest('.has-error')) {
        setError(target, '');
      }
    });
  }

  /* ---------------------------------------------------------------- run
     Everything except the theme waits for the page to be on screen: measuring
     the header or observing a reveal target while the splash is up gives zero
     for every box, and neither corrects itself afterwards. */
  function start() {
    headroom();
    reveal();
    backToTop();
    tagLinks();
    mobileMenu();
    resumeDialog();
    copyButtons();
    localTime();
    contactForm();
    document.dispatchEvent(new Event('site:ready'));
  }

  if (splash) {
    var config = (window.portfolio && window.portfolio.splashScreen) || {};
    window.setTimeout(function () {
      splash.parentNode.removeChild(splash);

      /* Removing the container does NOT stop the animation — lottie-web holds
         every animation in a global registry and keeps ticking it forever, so
         the intro would cost CPU for the rest of the session. render.js names
         this one so it can be destroyed here; the others are still on screen
         and must be left alone. */
      if (window.lottie && window.__SPLASH_ANIM) {
        try {
          window.lottie.destroy(window.__SPLASH_ANIM);
        } catch (err) {
          /* an older player without destroy(name) just keeps animating */
        }
      }

      page.style.display = '';
      start();
    }, config.duration || 2000);
  } else {
    start();
  }
})();
