/**
 * Builds the page from portfolio.js. Contains no copy — every string a visitor
 * reads comes from the config; this file only decides shape.
 *
 * Wrappers that look redundant are load-bearing for the stylesheet — do not
 * tidy them away.
 *
 * Runs synchronously at the end of <body>, so the DOM is complete before
 * script.js binds to it. Classic script, no modules: file:// blocks module
 * loading and this page must work opened straight off disk.
 *
 * Every section checks its own `display` flag and returns early.
 */

(function () {
  'use strict';

  var data = window.portfolio || portfolio;
  var root = document.getElementById('root');
  if (!root || !data) return;

  // `dark-mode` goes on this element, above the splash/content switch, so the
  // splash is themed too.
  var themeRoot = document.createElement('div');
  // Built alongside the splash and hidden until its timer is up.
  var page = document.createElement('div');

  /* ----------------------------------------------------------- helpers */

  // `text` is assigned via textContent; `html` opts into innerHTML and is used
  // only for config strings carrying deliberate <strong>.
  function el(tag, opts) {
    var node = document.createElement(tag);
    opts = opts || {};
    if (opts.className) node.className = opts.className;
    if (opts.id) node.id = opts.id;
    if (opts.text != null) node.textContent = opts.text;
    if (opts.html != null) node.innerHTML = opts.html;
    if (opts.attrs) {
      Object.keys(opts.attrs).forEach(function (key) {
        if (opts.attrs[key] != null) node.setAttribute(key, opts.attrs[key]);
      });
    }
    (opts.children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function br() {
    return document.createElement('br');
  }

  /* ------------------------------------------------------------- emoji
     Emoji are replaced by Twemoji PNGs so they render identically on every
     platform. */
  var TWEMOJI_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/';
  var EMOJI_STYLE =
    'height: 1em; width: 1em; margin: 0px 0.05em 0px 0.1em; vertical-align: -0.1em;';
  // Written in \u escapes so the ranges stay reviewable, and kept narrow so it
  // cannot match the em dashes and middle dots used throughout the config.
  var EMOJI_CHAR =
    '(?:[\\u2190-\\u21ff\\u2300-\\u23ff\\u2600-\\u27bf\\u2b00-\\u2bff]' +
    '|[\\ud800-\\udbff][\\udc00-\\udfff])';
  var EMOJI_RE = new RegExp(
    EMOJI_CHAR + '\\ufe0f?(?:\\u200d' + EMOJI_CHAR + '\\ufe0f?)*',
    'g'
  );

  function codePoints(str) {
    var points = [];
    var isSequence = str.indexOf('‍') !== -1;
    for (var i = 0; i < str.length; ) {
      var code = str.codePointAt(i);
      // Twemoji drops the variation selector from its filenames, except inside
      // a ZWJ sequence where it is significant.
      if (code !== 0xfe0f || isSequence) {
        points.push(code.toString(16));
      }
      i += code > 0xffff ? 2 : 1;
    }
    return points.join('-');
  }

  // Offline, Chrome paints a broken-image icon beside the alt text. Replacing
  // the img with its own alt shows the system emoji instead.
  var EMOJI_FALLBACK =
    'this.replaceWith(document.createTextNode(this.alt))';

  // Returns an HTML string, because every caller is already building one.
  function emoji(text) {
    if (text == null) return '';
    return String(text).replace(EMOJI_RE, function (match) {
      return (
        '<img alt="' +
        match +
        '" draggable="false" src="' +
        TWEMOJI_BASE +
        codePoints(match) +
        '.png" onerror="' +
        EMOJI_FALLBACK +
        '" style="' +
        EMOJI_STYLE +
        '">'
      );
    });
  }

  // `which` is one of the reveal-* modifiers in styles.css; script.js adds
  // `is-visible` when the element scrolls into view.
  function reveal(node, which) {
    node.className = (node.className ? node.className + ' ' : '') + 'reveal ' + which;
    return node;
  }

  /* ---------------------------------------------------------- svg / art */

  // Parses a markup string and returns its root element, marked aria-hidden
  // unless it declares its own. Illustrations are presentation, not content,
  // so they live here rather than in the config.
  function svg(markup) {
    var wrap = document.createElement('div');
    wrap.innerHTML = markup;
    var node = wrap.firstElementChild;
    if (node && !node.hasAttribute('aria-hidden')) {
      node.setAttribute('aria-hidden', 'true');
    }
    return node;
  }

  // Static fallbacks, drawn when a Lottie scene is unavailable. Files rather
  // than inline markup because each is tens of KB of paths, and an <img> loads
  // over file:// where a fetch would not.
  var ART = {
    programmer:
      '<img class="art" src="images/programmer.svg" alt="" width="1041" height="554">',

    // width/height are each file's intrinsic size, so the box is reserved
    // before the SVG loads and nothing shifts. alt="" is deliberate: these are
    // decorative, and this file must contain no copy.
    manOnTable:
      '<img class="art" src="images/manOnTable.svg" alt="" width="996" height="828">',
    developerActivity:
      '<img class="art" src="images/developerActivity.svg" alt="" width="1144" height="617">',
    skill:
      '<img class="art" src="images/skill.svg" alt="" width="1090" height="823">',
    contactMailDark:
      '<img class="art" src="images/contactMailDark.svg" alt="" width="1035" height="832">',

    // The pin from GithubProfileCard.js, used beside a location line.
    pin:
      '<svg viewBox="-0.5 -2 20 19" width="22" height="16" aria-hidden="true" stroke="currentColor">' +
      '<path fill-rule="evenodd" d="M6 0C2.69 0 0 2.5 0 5.5 0 10.02 6 16 6 16s6-5.98 6-10.5C12 2.5 9.31 0 6 0zm0 14.55C4.14 12.52 1 8.44 1 5.5 1 3.02 3.25 1 6 1c1.34 0 2.61.48 3.56 1.36.92.86 1.44 1.97 1.44 3.14 0 2.94-3.14 7.02-5 9.05zM8 5.5c0 1.11-.89 2-2 2-1.11 0-2-.89-2-2 0-1.11.89-2 2-2 1.11 0 2 .89 2 2z"></path></svg>',
  };

  // Shared with script.js through window.__SPLASH_ANIM so neither file
  // hardcodes the string twice.
  var SPLASH_ANIM = 'splash';

  /**
   * Returns { node, mount } for an illustration: the Lottie scene when one is
   * available, otherwise the static fallback. `mount` must run after the node
   * is in the document, because lottie-web sizes its svg to the container.
   *
   * The stage is a bare <div> deliberately — its height comes from the svg
   * lottie-web puts inside it, and giving it one here would override that.
   *
   * `name` registers the animation so it can be destroyed later. lottie-web
   * keeps every animation in a global registry and ticks it forever; removing
   * the container does NOT stop it. Only the splash needs this.
   */
  function lottieArt(sceneName, fallbackMarkup, name) {
    var wanted = !!(data.illustration && data.illustration.animated);
    var scenes = window.LOTTIE_SCENES || {};
    var scene = sceneName && scenes[sceneName];

    if (!wanted || typeof window.lottie === 'undefined' || !scene) {
      return { node: fallbackMarkup ? svg(fallbackMarkup) : null, mount: null };
    }

    var stage = el('div');
    return {
      node: stage,
      mount: function () {
        window.lottie.loadAnimation({
          container: stage,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: scene,
          name: name || undefined,
        });
      },
    };
  }

  // The same conditions lottieArt() checks, for callers that need to ask
  // rather than fall back — the résumé button stays inert without a scene.
  function sceneAvailable(name) {
    return !!(
      data.illustration &&
      data.illustration.animated &&
      typeof window.lottie !== 'undefined' &&
      name &&
      (window.LOTTIE_SCENES || {})[name]
    );
  }

  // Lets script.js mount a scene whose timing it owns. The résumé dialog is
  // built `hidden`, and a hidden container measures zero, so its scene cannot
  // be mounted at build time like the others.
  window.__mountScene = function (name, container) {
    if (!container || !sceneAvailable(name)) return false;
    window.lottie.loadAnimation({
      container: container,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: window.LOTTIE_SCENES[name],
    });
    return true;
  };

  // Collected while building, run in one pass after the tree is in the
  // document — see lottieArt().
  var mounts = [];

  function mountLater(art) {
    if (art && art.mount) mounts.push(art.mount);
    return art ? art.node : null;
  }

  /* ------------------------------------------------------ social media
     SocialMedia.js: one <a class="icon-button {network}"> per profile with a
     Font Awesome <i> inside. The class is what colours the circle. */
  var SOCIAL_ICONS = {
    github: { cls: 'github', icon: 'fab fa-github' },
    linkedin: { cls: 'linkedin', icon: 'fab fa-linkedin-in' },
    mail: { cls: 'google', icon: 'fas fa-envelope' },
    gitlab: { cls: 'gitlab', icon: 'fab fa-gitlab' },
    facebook: { cls: 'facebook', icon: 'fab fa-facebook-f' },
    twitter: { cls: 'twitter', icon: 'fab fa-twitter' },
    medium: { cls: 'medium', icon: 'fab fa-medium' },
    stackoverflow: { cls: 'stack-overflow', icon: 'fab fa-stack-overflow' },
    instagram: { cls: 'instagram', icon: 'fab fa-instagram' },
    kaggle: { cls: 'kaggle', icon: 'fab fa-kaggle' },
  };

  function socialMedia() {
    var cfg = data.socialMedia;
    if (!cfg || !cfg.display) return null;

    return el('div', {
      className: 'social-media-div',
      children: cfg.profiles.map(function (profile) {
        var spec = SOCIAL_ICONS[profile.network] || { cls: '', icon: 'fas fa-link' };
        var isMail = profile.network === 'mail';
        return el('a', {
          className: 'icon-button ' + spec.cls,
          attrs: {
            href: profile.href,
            // The icon font carries no text, so the link needs a name of its
            // own or a screen reader reads the bare URL.
            'aria-label': profile.label,
            target: isMail ? null : '_blank',
            rel: isMail ? null : 'noopener noreferrer',
          },
          children: [
            el('i', { className: spec.icon, attrs: { 'aria-hidden': 'true' } }),
            el('span'),
          ],
        });
      }),
    });
  }

  /* ------------------------------------------------------ splash screen
     SplashScreen.js. Held for `duration`, then removed by script.js, which
     also unhides the page and fires `site:ready`. */
  function buildSplash() {
    var cfg = data.splashScreen;
    if (!cfg || !cfg.enabled) return null;

    // Named so script.js can destroy it when the splash comes down; otherwise
    // it keeps animating off-screen for the life of the page.
    var art = lottieArt(cfg.animation, null, SPLASH_ANIM);
    if (!art.node) return null; // no scene registered — skip rather than hang
    mountLater(art);

    return el('div', {
      className: 'splash-container',
      id: 'splash',
      children: [
        el('div', { className: 'splash-animation-container', children: [art.node] }),
        el('div', {
          className: 'splash-title-container',
          children: [
            el('span', { className: 'grey-color', text: ' <' }),
            el('span', { className: 'splash-title', text: data.meta.brand }),
            el('span', { className: 'grey-color', text: '/>' }),
          ],
        }),
      ],
    });
  }

  /* ------------------------------------------------------------ header
     Header.js inside react-headroom. The wrapper/inner pair and the
     headroom--* classes are headroom's; script.js drives them. */
  function buildHeader() {
    var brand = el('a', {
      className: 'logo',
      // A hash rather than "/", which would walk off the page over file://.
      attrs: { href: '#greeting' },
      children: [
        el('span', { className: 'grey-color', text: ' <' }),
        el('span', { className: 'logo-name', text: data.meta.brand }),
        el('span', { className: 'grey-color', text: '/>' }),
      ],
    });

    // Drops entries whose section is switched off. The lookup goes through
    // `configKey` because an entry's `id` is the DOM anchor and is not always
    // the config key — without it the entry is never filtered.
    var links = (data.nav || []).filter(function (entry) {
      var cfg = data[entry.configKey || entry.id];
      return !cfg || cfg.display !== false;
    });

    var items = links.map(function (entry) {
      return el('li', {
        children: [el('a', { attrs: { href: '#' + entry.id }, text: entry.label })],
      });
    });

    var toggle = el('label', {
      className: 'switch',
      children: [
        el('input', { id: 'theme-toggle', attrs: { type: 'checkbox', 'aria-label': 'Switch to dark theme' } }),
        el('span', {
          className: 'slider round',
          children: [el('span', { className: 'emoji', id: 'theme-emoji', html: emoji('☀️') })],
        }),
      ],
    });
    items.push(el('li', { children: [el('a', { children: [toggle] })] }));

    return el('div', {
      className: 'headroom-wrapper',
      id: 'headroom-wrapper',
      children: [
        el('div', {
          className: 'headroom headroom--unfixed',
          id: 'headroom',
          children: [
            el('header', {
              className: 'header',
              children: [
                brand,
                el('input', { className: 'menu-btn', id: 'menu-btn', attrs: { type: 'checkbox' } }),
                el('label', {
                  className: 'menu-icon',
                  attrs: { for: 'menu-btn', 'aria-label': 'Menu' },
                  children: [el('span', { className: 'navicon' })],
                }),
                el('ul', { className: 'menu', children: items }),
              ],
            }),
          ],
        }),
      ],
    });
  }

  /* ---------------------------------------------------------- greeting
     Greeting.js. Fade bottom, duration 1000, distance 40px. */
  function buildGreeting() {
    var cfg = data.greeting;
    if (!cfg || !cfg.display) return;

    var title = el('h1', { className: 'greeting-text' });
    // The surrounding spaces keep the wave clear of the last letter.
    title.appendChild(document.createTextNode(' ' + cfg.salutation + ' '));
    // Name and wave are kept together so the line cannot break between them,
    // leaving the emoji alone on a line of its own.
    var nameSpan = el('span', { className: 'nowrap', text: cfg.name + ' ' });
    nameSpan.appendChild(
      el('span', {
        className: 'wave-emoji',
        html: emoji(cfg.emoji),
        attrs: { role: 'img', 'aria-label': cfg.emojiLabel },
      })
    );
    title.appendChild(nameSpan);

    var buttons = (cfg.buttons || []).map(function (button) {
      return el('div', {
        children: [el('a', { className: 'main-button', attrs: { href: button.href }, text: button.label })],
      });
    });

    // With no resumeLink but a scene to show, the button opens the dialog
    // instead of downloading. role and tabindex are needed because an hrefless
    // <a> is not focusable; both drop away once a real resumeLink exists.
    var opensDialog =
      !cfg.resumeLink &&
      cfg.resumeDialog &&
      sceneAvailable(cfg.resumeDialog.animation);

    if (cfg.resumeLink || cfg.resumeButtonForShow) {
      buttons.push(
        el('a', {
          className: 'download-link-button',
          attrs: {
            href: cfg.resumeLink || null,
            download: cfg.resumeLink ? 'Resume.pdf' : null,
            id: opensDialog ? 'resume-button' : null,
            role: opensDialog ? 'button' : null,
            tabindex: opensDialog ? '0' : null,
            'aria-haspopup': opensDialog ? 'dialog' : null,
            'aria-expanded': opensDialog ? 'false' : null,
          },
          children: [
            el('div', {
              children: [el('a', { className: 'main-button', text: 'Download my resume' })],
            }),
          ],
        })
      );
    }

    var textDiv = el('div', {
      className: 'greeting-text-div',
      children: [
        el('div', {
          children: [
            title,
            el('p', { className: 'greeting-text-p subTitle', html: emoji(cfg.intro) }),
            el('div', { className: 'empty-div', id: 'resume' }),
            socialMedia(),
            el('div', { className: 'button-greeting-div', children: buttons }),
          ],
        }),
      ],
    });

    var art = lottieArt(cfg.animation, ART[cfg.illustration] || ART.manOnTable);
    var imageDiv = el('div', { className: 'greeting-image-div', children: [mountLater(art)] });

    page.appendChild(
      reveal(
        el('div', {
          className: 'greet-main',
          id: 'greeting',
          children: [el('div', { className: 'greeting-main', children: [textDiv, imageDiv] })],
        }),
        'reveal-bottom-40'
      )
    );
  }

  // Built hidden; script.js mounts the scene on first open, because lottie-web
  // measures its container and a hidden one measures zero.
  function buildResumeDialog() {
    var cfg = data.greeting;
    if (!cfg || !cfg.display || !cfg.resumeButtonForShow) return;
    // A real résumé link needs no joke, and no scene means nothing to show.
    if (cfg.resumeLink) return;
    var dialog = cfg.resumeDialog;
    if (!dialog || !sceneAvailable(dialog.animation)) return;

    page.appendChild(
      el('div', {
        className: 'resume-dialog',
        id: 'resume-dialog',
        attrs: {
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': dialog.label,
          hidden: '',
        },
        children: [
          // `data-close` marks everything that dismisses the dialog, so
          // script.js binds one handler rather than one per control.
          el('div', { className: 'resume-dialog-backdrop', attrs: { 'data-close': '' } }),
          el('div', {
            className: 'resume-dialog-panel',
            children: [
              el('button', {
                className: 'resume-dialog-close',
                attrs: { type: 'button', 'aria-label': dialog.close, 'data-close': '' },
              }),
              // `data-scene` tells script.js what to mount without it having
              // to read the config.
              el('div', { attrs: { 'data-scene': dialog.animation } }),
            ],
          }),
        ],
      })
    );
  }

  function buildSkills() {
    var cfg = data.skills;
    if (!cfg || !cfg.display) return;

    var art = lottieArt(cfg.animation, ART[cfg.illustration] || ART.developerActivity);
    var imageDiv = reveal(
      el('div', { className: 'skills-image-div', children: [mountLater(art)] }),
      'reveal-left'
    );

    var devIcons = el('ul', {
      className: 'dev-icons',
      children: (cfg.techMarks || []).map(function (mark) {
        return el('li', {
          className: 'software-skill-inline',
          // `--brand` is read by the hover rule in styles.css. Marks without a
          // colour set no style attribute and inherit the indigo fallback.
          attrs: {
            name: mark.name,
            style: mark.color ? '--brand: ' + mark.color : null,
          },
          children: [
            el('i', { className: mark.icon, attrs: { 'aria-hidden': 'true' } }),
            el('p', { text: mark.name }),
          ],
        });
      }),
    });

    var lines = el('div', {
      children: (cfg.items || []).map(function (item) {
        return el('p', {
          className: 'subTitle skills-text',
          html: emoji(item.icon) + ' ' + item.text,
        });
      }),
    });

    var copy = [
      el('h2', { className: 'skills-heading', text: cfg.title + ' ' }),
      el('p', { className: 'subTitle skills-text-subtitle', text: cfg.subtitle }),
      el('div', { children: [el('div', { className: 'software-skills-main-div', children: [devIcons] })] }),
      lines,
    ];

    var textDiv = reveal(
      el('div', { className: 'skills-text-div', children: copy }),
      'reveal-right'
    );

    page.appendChild(
      el('div', {
        className: 'main',
        id: 'skills',
        children: [el('div', { className: 'skills-main-div', children: [imageDiv, textDiv] })],
      })
    );
  }

  // The stylesheet hides the illustration column below 1456px, so the bars run
  // full width at the usual desktop sizes.
  function buildProficiency() {
    var cfg = data.proficiency;
    if (!cfg || !cfg.display || !cfg.bars.length) return;

    var bars = cfg.bars.map(function (bar) {
      var fill = el('span');
      fill.style.width = bar.percent + '%';
      return el('div', {
        className: 'skill',
        children: [
          el('p', { text: bar.label }),
          el('div', {
            className: 'meter',
            attrs: {
              role: 'progressbar',
              'aria-valuenow': String(bar.percent),
              'aria-valuemin': '0',
              'aria-valuemax': '100',
              'aria-label': bar.label,
            },
            children: [fill],
          }),
        ],
      });
    });

    var art = lottieArt(cfg.animation, ART[cfg.illustration] || ART.skill);

    page.appendChild(
      reveal(
        el('div', {
          className: 'skills-container',
          id: 'proficiency',
          children: [
            el('div', {
              className: 'skills-bar',
              children: [el('h2', { className: 'skills-heading', text: cfg.title })].concat(bars),
            }),
            el('div', { className: 'skills-image', children: [mountLater(art)] }),
          ],
        }),
        'reveal-bottom'
      )
    );
  }

  // Off in the config by decision, not omission.
  function buildEducation() {
    var cfg = data.education;
    if (!cfg || !cfg.display || !cfg.schools.length) return;

    var cards = [];
    cfg.schools.forEach(function (school) {
      cards.push(
        el('div', {
          children: [
            reveal(
              el('div', {
                className: 'education-card',
                children: [
                  el('div', {
                    className: 'education-card-right',
                    children: [
                      el('h5', { className: 'education-text-school', text: school.institution }),
                      el('div', {
                        className: 'education-text-details',
                        children: [
                          el('h5', { className: 'education-text-subHeader', text: school.degree }),
                          el('p', { className: 'education-text-duration', text: school.period }),
                          el('div', {
                            className: 'education-text-bullets',
                            children: [
                              el('ul', {
                                children: (school.points || []).map(function (point) {
                                  return el('li', { className: 'subTitle', text: point });
                                }),
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              'reveal-left'
            ),
            reveal(el('div', { className: 'education-card-border' }), 'reveal-slide-left'),
          ],
        })
      );
    });

    page.appendChild(
      el('div', {
        className: 'education-section',
        id: 'education',
        children: [
          el('h2', { className: 'education-heading', text: cfg.title }),
          el('div', { className: 'education-card-container', children: cards }),
        ],
      })
    );
  }

  // No company logos ship, so `accent` in the config supplies the banner
  // colour: either one of these names or any literal CSS colour.
  var ACCENTS = { primary: '#55198b', alt: '#6c63ff' };

  function accentColour(name) {
    return ACCENTS[name] || name || ACCENTS.primary;
  }

  function buildExperience() {
    var cfg = data.experience;
    if (!cfg || !cfg.display || !cfg.roles.length) return;

    var cards = cfg.roles.map(function (role) {
      // The monogram stands in for the company logo, so it takes the company
      // colour too.
      var badge = el('span', {
        className: 'experience-roundedimg',
        text: role.badge,
        attrs: { 'aria-hidden': 'true' },
      });
      badge.style.color = accentColour(role.accent);

      var banner = el('div', {
        className: 'experience-banner',
        children: [
          el('div', { className: 'experience-blurred_div' }),
          el('div', {
            className: 'experience-div-company',
            children: [el('h5', { className: 'experience-text-company', text: role.org })],
          }),
          badge,
        ],
      });
      banner.style.background = accentColour(role.accent);

      var meta = [role.period, role.location].filter(Boolean).join(' · ');

      return el('div', {
        className: 'experience-card',
        children: [
          banner,
          el('div', {
            className: 'experience-text-details',
            children: [
              el('h5', { className: 'experience-text-role', text: role.role }),
              el('h5', { className: 'experience-text-date', text: meta }),
              el('p', { className: 'subTitle experience-text-desc', text: role.summary }),
              el('ul', {
                children: (role.points || []).map(function (point) {
                  return el('li', { className: 'subTitle', text: point });
                }),
              }),
            ],
          }),
        ],
      });
    });

    page.appendChild(
      el('div', {
        id: 'experience',
        children: [
          reveal(
            el('div', {
              className: 'experience-container',
              id: 'workExperience',
              children: [
                el('div', {
                  children: [
                    el('h2', { className: 'experience-heading', text: cfg.title }),
                    el('p', { className: 'subTitle project-subtitle', text: cfg.subtitle }),
                    el('div', { className: 'experience-cards-div', children: cards }),
                  ],
                }),
              ],
            }),
            'reveal-bottom'
          ),
        ],
      })
    );
  }

  // Every card is the same width; `featured` in the config is not read here.
  function buildProjects() {
    var cfg = data.projects;
    if (!cfg || !cfg.display || !cfg.items.length) return;

    var cards = cfg.items.map(function (project) {
      var heading = el('h5', { className: 'card-title', text: project.name });
      if (project.status) {
        heading.appendChild(document.createTextNode(' '));
        heading.appendChild(el('span', { className: 'status-tag', text: project.status }));
      }

      var detail = [
        heading,
        el('p', {
          className: 'card-subtitle',
          text: [project.kind, project.focus].filter(Boolean).join(' — '),
        }),
      ];

      var body = el('dl', { className: 'project-body' });
      [
        ['Problem', project.problem],
        ['Approach', project.approach],
        ['Outcome', project.outcome],
      ].forEach(function (pair) {
        if (!pair[1]) return;
        body.appendChild(el('dt', { text: pair[0] }));
        body.appendChild(el('dd', { text: pair[1] }));
      });
      detail.push(body);

      if (project.artifacts && project.artifacts.length) {
        detail.push(
          el('ul', {
            className: 'artifact-list',
            attrs: { 'aria-label': 'What one run hands back' },
            children: project.artifacts.map(function (artifact) {
              return el('li', {
                children: [
                  el('code', { text: artifact.file }),
                  el('span', { text: artifact.note }),
                ],
              });
            }),
          })
        );
      }

      var footer = el('div', {
        className: 'project-card-footer',
        children: (project.tags || []).map(function (tag) {
          return el('span', { className: 'project-tag', text: tag });
        }),
      });

      // Link buttons appear only for URLs that exist.
      [
        { url: project.repo, label: 'Source' },
        { url: project.demo, label: 'Live demo' },
      ].forEach(function (link) {
        if (!link.url) return;
        footer.appendChild(
          el('span', {
            className: 'project-tag',
            text: link.label,
            attrs: { 'data-url': link.url },
          })
        );
      });

      detail.push(footer);

      return el('div', {
        className: 'project-card project-card-light',
        children: [el('div', { className: 'project-detail', children: detail })],
      });
    });

    page.appendChild(
      reveal(
        el('div', {
          className: 'main',
          id: 'projects',
          children: [
            el('div', {
              children: [
                el('h2', { className: 'skills-heading', text: cfg.title }),
                el('p', { className: 'subTitle project-subtitle', text: cfg.subtitle }),
                el('div', { className: 'projects-container', children: cards }),
              ],
            }),
          ],
        }),
        'reveal-bottom'
      )
    );
  }

  // Blogs and talks, rendered as project cards.
  function buildCardFeed(cfg, id) {
    if (!cfg || !cfg.display || !cfg.items.length) return;

    var cards = cfg.items.map(function (item) {
      var detail = [el('h5', { className: 'card-title', text: item.title })];
      if (item.meta) detail.push(el('p', { className: 'card-subtitle', text: item.meta }));
      if (item.body) detail.push(el('p', { className: 'card-subtitle', text: item.body }));
      if (item.href) {
        detail.push(
          el('div', {
            className: 'project-card-footer',
            children: [
              el('span', {
                className: 'project-tag',
                text: item.linkLabel || 'Read',
                attrs: { 'data-url': item.href },
              }),
            ],
          })
        );
      }
      return el('div', {
        className: 'project-card project-card-light',
        children: [el('div', { className: 'project-detail', children: detail })],
      });
    });

    page.appendChild(
      reveal(
        el('div', {
          className: 'main',
          id: id,
          children: [
            el('div', {
              children: [
                el('h2', { className: 'skills-heading', text: cfg.title }),
                el('p', { className: 'subTitle project-subtitle', text: cfg.subtitle }),
                el('div', { className: 'projects-container', children: cards }),
              ],
            }),
          ],
        }),
        'reveal-bottom'
      )
    );
  }

  // About Me: an 80/20 row with an illustration in the narrow column.
  function buildBigPicture() {
    var cfg = data.bigPicture;
    if (!cfg || !cfg.display) return;

    var paragraphs = cfg.paragraphs || [];
    var content = [];

    if (paragraphs.length) {
      // h3 so the quote stays a level below the section heading.
      content.push(el('h3', { className: 'bio-text', text: '"' + paragraphs[0] + '"' }));
    }
    paragraphs.slice(1).forEach(function (text) {
      content.push(el('p', { className: 'subTitle', text: text }));
    });

    // Rendered only when there are bullets; an empty <ul> would still cost its
    // padding and margin.
    if ((cfg.capabilities || []).length) {
      content.push(
        el('div', {
          className: 'education-text-bullets',
          children: [
            el('ul', {
              className: 'capability-bullets',
              children: cfg.capabilities.map(function (item) {
                return el('li', {
                  className: 'subTitle',
                  children: [
                    el('strong', { text: item.title }),
                    document.createTextNode(' — ' + item.body),
                  ],
                });
              }),
            }),
          ],
        })
      );
    }

    var facts = el('div', { className: 'opp-div' });
    (cfg.facts || []).forEach(function (fact, index) {
      var line = el('span', { className: 'desc-prof' });
      if (index === 0) line.appendChild(svg(ART.pin));
      line.appendChild(el('span', { className: 'fact-label', text: fact.label + ': ' }));
      line.appendChild(document.createTextNode(fact.value));
      facts.appendChild(line);
      facts.appendChild(br());
    });
    content.push(facts);

    page.appendChild(
      reveal(
        el('div', {
          className: 'main',
          id: 'about',
          children: [
            el('h2', { className: 'skills-heading', text: cfg.title }),
            el('p', { className: 'subTitle project-subtitle', text: cfg.headline }),
            el('div', {
              className: 'row',
              children: [
                el('div', { className: 'main-content-profile', children: content }),
                el('div', {
                  className: 'image-content-profile',
                  attrs: { 'aria-hidden': 'true' },
                  children: [
                    mountLater(lottieArt(cfg.animation, ART[cfg.illustration] || ART.programmer)),
                  ],
                }),
              ],
            }),
          ],
        }),
        'reveal-bottom'
      )
    );
  }

  function buildContact() {
    var cfg = data.contact;
    if (!cfg || !cfg.display) return;

    var details = [];

    if (cfg.phone) {
      details.push(
        el('a', {
          className: 'contact-detail',
          attrs: { href: 'tel:' + (cfg.phoneHref || cfg.phone) },
          text: cfg.phone,
        }),
        br(),
        br()
      );
    }

    // Rendered only when `email` is set; it is empty by decision so the
    // address is not printed in full for harvesters.
    if (cfg.email) {
      details.push(
        el('a', { className: 'contact-detail-email', attrs: { href: 'mailto:' + cfg.email }, text: cfg.email }),
        el('button', {
          className: 'copy-btn',
          text: 'Copy',
          attrs: { type: 'button', 'data-copy': cfg.email },
        }),
        br(),
        br()
      );
    }

    var textDiv = el('div', {
      className: 'contact-text-div',
      children: details.concat([socialMedia()]),
    });

    var art = lottieArt(cfg.animation, ART[cfg.illustration] || ART.contactMailDark);

    var main = el('div', {
      className: 'contact-div-main',
      children: [
        el('div', {
          className: 'contact-header',
          children: [
            el('h2', { className: 'heading contact-title', text: cfg.title }),
            el('p', { className: 'subTitle contact-subtitle', text: cfg.quote }),
            textDiv,
          ],
        }),
        el('div', { className: 'contact-image-div', children: [mountLater(art)] }),
      ],
    });

    var extras = el('div', { className: 'contact-extras' });

    var availability = el('div', { className: 'opp-div' });
    // Rendered only when a location is configured; empty by decision.
    if (cfg.location) {
      var based = el('span', { className: 'desc-prof' });
      based.appendChild(svg(ART.pin));
      based.appendChild(document.createTextNode(cfg.location));
      availability.appendChild(based);
      availability.appendChild(br());
    }
    // Rendered only when `openToWork` is a boolean; omitted from the config.
    if (typeof cfg.openToWork === 'boolean') {
      availability.appendChild(
        el('span', {
          className: 'desc-prof',
          text: 'Open for opportunities: ' + (cfg.openToWork ? 'Yes' : 'No'),
        })
      );
      availability.appendChild(br());
    }
    extras.appendChild(availability);

    if (cfg.form && cfg.form.display) {
      var fields = [
        { id: 'field-name', name: 'name', label: 'Your name', type: 'text', autocomplete: 'name' },
        { id: 'field-email', name: 'email', label: 'Your email', type: 'email', autocomplete: 'email' },
        { id: 'field-message', name: 'message', label: 'Message', type: 'textarea' },
      ].map(function (field) {
        var input =
          field.type === 'textarea'
            ? el('textarea', { id: field.id, attrs: { name: field.name, rows: '5', required: '' } })
            : el('input', {
                id: field.id,
                attrs: {
                  name: field.name,
                  type: field.type,
                  autocomplete: field.autocomplete,
                  required: '',
                },
              });

        return el('div', {
          className: 'contact-form-field',
          children: [
            el('label', { attrs: { for: field.id }, text: field.label }),
            input,
            el('p', {
              className: 'field-error',
              attrs: { 'data-error-for': field.id, role: 'alert' },
            }),
          ],
        });
      });

      extras.appendChild(
        el('form', {
          className: 'contact-form',
          id: 'contact-form',
          attrs: { novalidate: '' },
          children: [
            el('p', {
              className: 'form-note',
              text: 'This form has no server behind it — sending opens your mail client with the message prefilled.',
            }),
          ]
            .concat(fields)
            .concat([
              el('button', { className: 'main-button', text: 'Send message', attrs: { type: 'submit' } }),
              el('p', {
                className: 'form-status',
                id: 'form-status',
                attrs: { role: 'status', 'aria-live': 'polite' },
              }),
            ]),
        })
      );
    }

    page.appendChild(
      reveal(
        el('div', {
          className: 'main contact-margin-top',
          id: 'contact',
          children: [main, extras],
        }),
        'reveal-bottom'
      )
    );
  }

  function buildFooter() {
    // One line: the config text, then the clock as a span, because script.js
    // re-renders `#local-time` every 30s. An empty `meta.copyright` leaves the
    // clock printing on its own.
    var line = el('p', {
      className: 'footer-text',
      text: (data.meta.copyright ? data.meta.copyright + ' | ' : '') + 'Local time: ',
    });
    line.appendChild(el('span', { id: 'local-time', text: '—' }));

    page.appendChild(
      reveal(el('div', { className: 'footer-div', children: [line] }), 'reveal-bottom-5')
    );

    page.appendChild(
      el('button', {
        id: 'topButton',
        attrs: { title: 'Go to top', type: 'button', 'aria-label': 'Go to top' },
        children: [el('i', { className: 'fas fa-hand-point-up', attrs: { 'aria-hidden': 'true' } })],
      })
    );
  }

  /* -------------------------------------------------------------- run */
  document.title = data.meta.title;

  // These keep the live DOM in step with the config. They do NOT make
  // index.html's literal tags redundant: a social unfurler runs no JavaScript
  // and reads only those, so both must say the same thing.
  function metaTag(selector, value) {
    if (!value) return;
    var tag = document.head.querySelector(selector);
    if (tag) tag.setAttribute('content', value);
  }

  metaTag('meta[name="title"]', data.meta.title);
  metaTag('meta[property="og:title"]', data.meta.title);
  metaTag('meta[property="twitter:title"]', data.meta.title);
  metaTag('meta[name="description"]', data.meta.description);
  metaTag('meta[property="og:description"]', data.meta.description);
  metaTag('meta[property="twitter:description"]', data.meta.description);

  page.appendChild(buildHeader());
  buildGreeting();
  buildSkills();
  buildProficiency();
  buildEducation();
  buildExperience();
  buildProjects();
  buildCardFeed(data.blogs, 'blogs');
  buildCardFeed(data.talks, 'talks');
  buildBigPicture();
  buildContact();
  buildFooter();
  // A fixed overlay, so its position in the tree does not matter.
  buildResumeDialog();

  var splash = buildSplash();
  if (splash) {
    // Hidden rather than unbuilt, so the lottie scenes and the reveal observer
    // have a real tree to attach to the moment the splash goes.
    page.style.display = 'none';
    themeRoot.appendChild(splash);
  }
  themeRoot.appendChild(page);
  root.appendChild(themeRoot);

  // No module system, so these are shared with script.js as globals.
  window.__emoji = emoji;
  window.__SPLASH_ANIM = SPLASH_ANIM;

  // After the append, never before: lottie-web measures its container.
  mounts.forEach(function (mount) {
    mount();
  });
})();
