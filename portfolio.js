/**
 * Site content — the only file to edit to change what the site says.
 * render.js, script.js and styles.css contain no copy.
 *
 * One key per section, each with a `display` flag so a section can be switched
 * off without deleting its data or touching the renderer.
 *
 * Classic script, not a module: Chrome blocks `<script type="module">` over
 * file://, and this page has to work opened straight off disk.
 *
 * The reasoning behind these values is in CLAUDE.md under "Config reference".
 * Several are settled owner decisions — read it before changing one.
 */
var portfolio = {
  meta: {
    // title and description are duplicated in index.html's <head>. A social
    // unfurler runs no JavaScript and reads only that static copy, so the two
    // must be edited together.
    title: 'Waqar Sayyed — Full-Stack Developer',
    description:
      'Back-end focused full-stack developer building enterprise systems that businesses depend on daily. C#, .NET Core, ASP.NET Core, SQL Server, DevExpress.',
    brand: 'Waqar Sayyed',
    // The entire footer line except the clock, which render.js appends.
    copyright: '© 2022-2026 Waqar Sayyed — Full-Stack Developer | All Rights Reserved',
  },

  // false makes every illustrated section draw its static SVG instead of its
  // Lottie scene. The renderer takes the same path on its own when the player
  // or the named scene is missing; none of those cases is an error.
  illustration: {
    animated: true,
  },

  splashScreen: {
    enabled: true,
    animation: 'loadingHand',
    duration: 2000,
  },

  greeting: {
    display: true,
    animation: 'landingPerson',
    // Kept together so the emoji cannot wrap onto a line of its own.
    salutation: "Hi all, I'm",
    name: 'Waqar',
    emoji: '👋',
    emojiLabel: 'waving hand',
    intro:
      'A passionate full-stack developer 🚀 building applications across the whole development lifecycle — back-end focused, turning dense business requirements into software that holds up in production.',
    // No résumé PDF, by decision. An empty resumeLink renders the button with
    // no href and wires it to resumeDialog instead of a download.
    resumeLink: '',
    resumeButtonForShow: true,
    resumeDialog: {
      animation: 'poky404',
      // Announced by screen readers only; the visitor sees no caption.
      label: 'No résumé to download',
      close: 'Close',
    },
    buttons: [{ label: 'Contact me', href: '#contact' }],
  },

  socialMedia: {
    display: true,
    profiles: [
      { network: 'github', label: 'GitHub', handle: 'waqarsyd', href: 'https://github.com/waqarsyd' },
      { network: 'linkedin', label: 'LinkedIn', handle: 'waqarsayyed', href: 'https://www.linkedin.com/in/waqarsayyed/' },
      { network: 'mail', label: 'Email', handle: 'waqarsayyed.official@gmail.com', href: 'mailto:waqarsayyed.official@gmail.com' },
    ],
  },

  skills: {
    display: true,
    title: 'What I do',
    // Locked by the owner — do not reword, shorten or temper this line.
    // The capitals are literal; nothing applies text-transform.
    subtitle: 'CRAZY FULL STACK DEVELOPER WHO WANTS TO EXPLORE EVERY TECH STACK',
    animation: 'codingPerson',
    // `color` is the technology's brand hex, applied only on hover via the
    // --brand custom property. Each was read from the vendor's own logo asset;
    // do not round them to prettier values. Tiles naming no product carry none
    // and fall back to the stylesheet's indigo.
    techMarks: [
      { name: 'C#', icon: 'fas fa-hashtag', color: '#239120' },
      { name: '.NET Core', icon: 'fab fa-microsoft', color: '#7014E8' },
      { name: 'ASP.NET Core MVC', icon: 'fas fa-sitemap', color: '#7014E8' },
      { name: 'REST APIs', icon: 'fas fa-plug' },
      { name: 'SQL Server', icon: 'fas fa-database', color: '#CC2927' },
      { name: 'DevExpress', icon: 'fas fa-chart-bar', color: '#FF7200' },
      { name: 'HTML / CSS', icon: 'fab fa-html5', color: '#E44D26' },
      { name: 'JavaScript', icon: 'fab fa-js', color: '#F7DF1E' },
      { name: 'React', icon: 'fab fa-react', color: '#087EA4' },
      { name: 'Angular', icon: 'fab fa-angular', color: '#E40035' },
      { name: 'Java', icon: 'fab fa-java', color: '#E76F00' },
      { name: 'JDBC', icon: 'fas fa-link' },
      { name: 'Firebase', icon: 'fas fa-fire', color: '#FF9100' },
      { name: 'Docker', icon: 'fab fa-docker', color: '#1D63ED' },
      { name: 'Git', icon: 'fab fa-git-alt', color: '#F03C2E' },
      { name: 'Azure', icon: 'fas fa-cloud', color: '#0078D4' },
      { name: 'LLM APIs', icon: 'fas fa-robot' },
    ],
    // Capability statements, not a job description: no employer, no scale
    // claims, no industry vertical. Those belong on the experience cards.
    items: [
      { icon: '⚡', text: 'Engineer and ship <strong>modules for enterprise systems</strong> that businesses depend on daily.' },
      { icon: '🛠', text: 'Build and maintain <strong>backend services and REST APIs</strong> in C#, ASP.NET Core and SQL Server.' },
      { icon: '📊', text: 'Design the <strong>operational reports a business runs on</strong>, in DevExpress.' },
      { icon: '🎯', text: 'Turn <strong>BRD and FRD requirements</strong> into working features alongside QA, product and support.' },
    ],
  },

  proficiency: {
    display: true,
    title: 'Proficiency',
    animation: 'build',
    // A self-assessment, not a measurement. Nothing derives these.
    bars: [
      { label: 'Backend', percent: 90 },
      { label: 'Database', percent: 80 },
      { label: 'Frontend', percent: 60 },
    ],
  },

  // Off by decision, not omission. Shape kept so filling it in is a data edit.
  education: {
    display: false,
    title: 'Education',
    schools: [], // { institution, degree, period, points: [] }
  },

  experience: {
    display: true,
    title: 'Experiences',
    subtitle: 'Where the work actually happens',
    roles: [
      {
        org: 'Suntech Business Solutions',
        badge: 'SB',
        accent: '#34679b',
        role: 'Software Engineer',
        period: 'Oct 2023 — present',
        location: 'Mumbai, India',
        current: true,
        summary:
          'Building and maintaining SUN FACET 2.0, an enterprise ERP for the jewellery, bullion and refinery trade, in daily use by more than a thousand businesses.',
        points: [
          'Engineer and ship modules for an ERP serving 1,000+ clients across six industry verticals.',
          'Build and maintain backend services and REST APIs in C#, ASP.NET Core and SQL Server.',
          'Develop and maintain features spanning jewellery, diamonds, bullion, manufacturing, refinery and watches.',
          'Turn BRD and FRD requirements into working features alongside QA, product and support.',
          'Design the reports the trade runs on, in DevExpress.',
          'Clear high-priority defects found in UAT inside fixed release windows.',
        ],
      },
      {
        org: 'QSpiders · JSpiders',
        badge: 'QJ',
        accent: '#ef994a',
        role: 'Java Full Stack Trainee',
        period: 'May — Oct 2023',
        location: '',
        current: false,
        summary:
          'Six months of full-stack training — Java, JDBC, SQL and the web tier — before moving into .NET professionally.',
        points: [
          'Covered Java, JDBC, SQL and the web tier end to end.',
          'Built the foundation the current .NET work sits on.',
        ],
      },
    ],
  },

  projects: {
    display: true,
    title: 'Projects',
    subtitle: 'Shipped end to end — design, build and release',
    // repo, demo, tags and status are empty by decision; each renders only when
    // filled in. `featured` is currently read by nothing.
    items: [
      {
        name: 'Forma',
        kind: 'Web application · independent',
        focus: 'Applied AI',
        status: '',
        featured: true,
        problem:
          'Rebuilding a DevExpress report that already exists means retyping it — every band, every coordinate — from a printout nobody has the source for.',
        approach:
          'Upload a screenshot, a PDF or an existing .repx and Forma returns three things at once: a written specification, a mockup you can check in the browser, and valid XtraReports XML that opens in the real designer. It reads the page geometry and writes the coordinates, so a report printed years ago can be rebuilt without retyping it.',
        outcome:
          'A report recovered from a photograph, as a file the designer opens. It ships with no API key of its own — you bring a Gemini key, held only for the tab you are in and never written to disk — and a companion Windows app hands the generated file straight to DevExpress with no download step.',
        artifacts: [
          { file: 'spec.md', note: 'the written specification' },
          { file: 'layout.json', note: 'the drawn mockup' },
          { file: 'report.repx', note: 'the file the designer opens' },
        ],
        tags: [],
        repo: '',
        demo: '',
      },
      {
        name: 'Purchase Management System',
        kind: 'Windows application',
        focus: 'Operations',
        status: '',
        featured: false,
        problem: 'Purchase orders, vendor records and reporting living in three different places.',
        approach:
          'One surface for raising orders, managing vendors and pulling reports, built for the people who are in it every day rather than for an occasional visitor.',
        outcome: 'Order creation, vendor management and reporting in a single tool.',
        artifacts: [],
        tags: [],
        repo: '',
        demo: '',
      },
    ],
  },

  blogs: { display: false, title: 'Blogs', subtitle: '', items: [] },

  talks: { display: false, title: 'Talks', subtitle: '', items: [] },

  // Config key is `bigPicture`, the section id is `about`, the heading reads
  // "About Me". Grep for all three.
  bigPicture: {
    display: true,
    title: 'About Me',
    headline: 'Precision is a habit, not a phase.',
    animation: 'aboutMe',
    illustration: 'programmer',
    // The owner's own words, supplied verbatim — do not rewrite. No technology
    // names here; the Skills grid is the one place the stack is listed.
    // paragraphs[0] renders as the pull quote, the rest as body copy.
    paragraphs: [
      "I'm a software developer who believes great software should feel effortless to the people using it even when there's a lot happening underneath.",
      "Most of my work has been on applications that businesses depend on daily, and that's shaped how I build. I like turning complex, messy requirements into something simple and well-structured, and I care about writing code that the next person can actually read, about systems that hold steady under real-world load, and about deployments that come and go without drama.",
      "I'm curious by nature and I like staying close to how the craft is evolving — not for the sake of chasing tools, but because better practices usually mean better outcomes: fewer bugs, speed and reliability rather than settling for \"it works.\"",
    ],
    capabilities: [],
    facts: [
      { label: 'Based in', value: 'Asia/Global' },
      { label: 'Open to', value: '.NET & full-stack roles' },
      { label: 'Ways of working', value: 'Agile, full SDLC' },
    ],
  },

  contact: {
    display: true,
    title: 'Reach Out to me!',
    animation: 'email',
    quote: 'Open to backend and full-stack roles — the fastest way to reach me is email.',
    // Empty by decision, so the address is not rendered at 40px for harvesters.
    // The contact form falls back to the socialMedia mail entry.
    email: '',
    location: '',
    // Not read by anything: script.js hardcodes Asia/Kolkata for the clock.
    timezone: 'Asia/Kolkata',
    form: { display: false },
  },

  // `id` is the anchor to jump to. Where it differs from the section's key in
  // this file, `configKey` must name that key or the display filter cannot find
  // the section and the entry is never hidden.
  nav: [
    { id: 'skills', label: 'Skills' },
    { id: 'proficiency', label: 'Proficiency' },
    { id: 'experience', label: 'Work Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'about', label: 'About Me', configKey: 'bigPicture' },
    { id: 'contact', label: 'Contact Me' },
  ],
};
