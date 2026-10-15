/**
 * ============================================================================
 * Site content
 * ============================================================================
 * Every page reads from this file, so editing the site never means editing
 * markup. Types are inferred from the literals (`as const`), which means a
 * typo in a key is a build error rather than a blank spot on the page.
 *
 * ┌─ BEFORE YOU DEPLOY ───────────────────────────────────────────────────┐
 * │ 1. `contact.email`, `socials.*.href` — swap in your real handles.     │
 * │ 2. `astro.config.mjs` → `site` — set your real domain.                │
 * │ 3. Drop your resume at `public/edward-wu-resume.pdf`.                 │
 * │ 4. `education[].gpa` — fill in or delete the field.                   │
 * └───────────────────────────────────────────────────────────────────────┘
 */

export const profile = {
  name: 'Edward Wu',
  /** Rendered as the small mono line under the name. Keep it to three beats. */
  discipline: ['AI & Machine Learning', 'Data Science', 'Full-Stack Development'],
  role: 'AI & ML · Full Stack · Finance',
  affiliation: 'University of Michigan',
  location: 'Ann Arbor, Michigan',
  /** Small status line in the hero. Set to '' to hide it. */
  status: 'Applying to MS & PhD programs · open to 2027 internships & full-time roles',
  /** The large line under the name in the home hero. */
  tagline: 'Never stop optimizing.',
  /** Chinese line under the tagline. Set to '' to hide it. */
  taglineZh: '时间就是金钱，效率就是生命。',
  /** One sentence. Used for <meta name="description"> and link previews. */
  description:
    'Edward Wu — data science student at the University of Michigan who solves problems with AI and machine learning and builds the full-stack software that puts the solutions in people\'s hands.',
  /** The "About me" section on the home page. */
  bio: [
    'I start from the problem and use technology to solve it. I choose, evaluate, and optimize the right models, then use full-stack engineering to turn the solution into a product others can use efficiently. LLMs are not always reliable, so I write programs that check and verify their output to improve accuracy. The goal is to use each technique where it is strongest.',
    'Outside of work, I play basketball, hit the gym, and cook. They keep giving me small problems worth solving with technology, such as tracking my training progress and analyzing my physical data. They also remind me that good software should make everyday life easier.',
    "Next, I'm applying to graduate programs in AI, computer science, and quantitative finance.",
  ],
} as const;

export const contact = {
  // TODO: replace with your real address before deploying.
  email: 'edward.wu@umich.edu',
  /** The download on /resume. It only renders once this file is in `public/`. */
  resume: '/edward-wu-resume.pdf',
} as const;

export const socials = [
  { label: 'Email', handle: contact.email, href: `mailto:${contact.email}` },
  { label: 'GitHub', handle: '@NautilusWu', href: 'https://github.com/NautilusWu' },
  { label: 'LinkedIn', handle: '/in/edwardwu', href: 'https://www.linkedin.com/in/edwardwu' },
] as const;

/** The top bar, the mobile menu, and the footer. */
export const nav = [
  { href: '/', label: 'Home' },
  { href: '/experience', label: 'Experience' },
  { href: '/writing', label: 'Writing' },
  { href: '/resume', label: 'Resume' },
] as const;

/**
 * Page headers. Each page and its link-preview card (`pages/og/`) read the
 * same entry, so the two cannot drift apart.
 */
export const pages = {
  experience: {
    title: "Where I've worked and taught",
    lede: 'Research and industry internships across AI, quantitative finance, and data analysis — and teaching statistics and Python to 170+ students along the way.',
    description:
      'Professional, teaching, and leadership experience of Edward Wu — AI research and quantitative-finance internships, data analysis, and teaching statistics and Python.',
  },
  writing: {
    title: 'Thinking out loud',
    lede: 'A personal blog. I write freely about what I keep coming back to — education, family education, and whatever else is on my mind.',
    description: 'Personal essays by Edward Wu on education, family education, and more.',
    /** Shown beside the post list; posts are tagged with these. */
    topics: ['Education', 'Family education'],
  },
} as const;

/** Three-up grid on the home page. */
export const focus = [
  {
    title: 'AI & Machine Learning',
    body: 'Large language models and the systems around them: honest baselines first, then profiling, quantization, and decoding strategies for fast inference, and agentic workflows that orchestrate subagents and tools.',
    tags: ['PyTorch', 'Hugging Face', 'OpenCV'],
  },
  {
    title: 'Data Science',
    body: 'Turning messy data into answers you can defend: quantifying the problem, testing ideas through backtests, and using the evidence to choose better actions for the future.',
    tags: ['Python', 'Pandas', 'SQL'],
  },
  {
    title: 'Full-Stack Development',
    body: 'End-to-end web software, from data and APIs to a fast, accessible front end.',
    tags: ['TypeScript', 'Astro', 'Docker'],
  },
] as const;

/**
 * Every role on the site. `start` and `end` are `YYYY-MM`; leave `end` empty
 * for a current role. Order here does not matter — pages sort newest first
 * (see `lib/experience.ts`). `kind` picks the section it appears in.
 */
export const experience = [
  {
    kind: 'professional',
    role: 'Research Intern',
    org: 'Shenzhen Research Institute of Big Data',
    location: 'Remote',
    start: '2026-08',
    end: '',
    bullets: [
      'Analyzing inference efficiency of open-source large models through a 12-configuration benchmark spanning multiple quantization levels and speculative decoding depths, evaluating throughput, latency, memory usage, and model fidelity.',
    ],
  },
  {
    kind: 'professional',
    role: 'Quantitative Research Intern',
    org: 'Shenzhen Guanghuiyuan Asset Management Co., Ltd.',
    location: 'Shenzhen, China',
    start: '2026-04',
    end: '2026-07',
    bullets: [
      'Engineered a Python/C++ backtesting system for China A-share high-dividend strategies, automating data extraction, preprocessing, factor screening, portfolio construction, benchmark comparison, and report generation.',
      'Designed a multi-factor equity strategy using dividend stability, profitability, cash-flow quality, valuation, risk-control, and industry-classification factors; achieved a 122.1% backtested cumulative return from 2021–2026, outperforming the S&P China A-Share Low Volatility High Dividend Index by 45.44 percentage points.',
    ],
  },
  {
    kind: 'professional',
    role: 'Research Assistant',
    org: 'University of California, Irvine',
    location: 'Irvine, CA',
    start: '2025-02',
    end: '2025-06',
    bullets: [
      'Built an OpenCV-based computer vision pipeline in Python to detect and track microbes in microscopy videos, applying background correction, adaptive thresholding, contour extraction, and frame-to-frame association to automate object-level motion analysis.',
    ],
  },
  {
    kind: 'professional',
    role: 'Data Analysis Intern',
    org: 'China CITIC Bank',
    location: 'Shenzhen, China',
    start: '2022-07',
    end: '2022-09',
    bullets: [
      'Conducted statistical analysis on 1,000+ green-loan, carbon-emission, and ESG data points using Pandas, NumPy, and Excel, while synthesizing 50+ policy documents and case studies to support green-banking strategy recommendations focused on sustainability and risk mitigation.',
    ],
  },
  {
    kind: 'teaching',
    role: 'Instructional Assistant',
    org: 'University of Michigan, Ann Arbor',
    location: 'Ann Arbor, MI',
    start: '2026-09',
    end: '',
    bullets: [
      'Mentored 50+ students in introductory statistics through 10+ hours of weekly office hours and course support, strengthening their statistical reasoning by guiding them through quantitative problem solving, interpretation of results, and common conceptual errors.',
    ],
  },
  {
    kind: 'teaching',
    role: 'Teaching Assistant',
    org: 'University of California, Irvine',
    location: 'Irvine, CA',
    start: '2024-09',
    end: '2025-06',
    bullets: [
      'Mentored 120+ students on core Python programming concepts, including data structures, debugging techniques, and project development, through one-on-one support and interactive lab sessions.',
      'Collaborated with instructors to identify learning challenges and relay student feedback, supporting a course section that saw a 4% increase in the share of A grades compared with the previous term.',
    ],
  },
  {
    kind: 'leadership',
    role: 'Captain & Quarterback',
    org: 'SFLS Jackdaws American Football Team',
    location: 'Shenzhen, China',
    start: '2021-06',
    end: '2023-07',
    bullets: [
      'Guided team to a championship as Captain and Quarterback; earned Most Valuable Player honors.',
    ],
  },
] as const;

/** The sections of /experience, in order, and the heading each one gets. */
export const experienceGroups = [
  { kind: 'professional', title: 'Professional', label: 'Industry & research' },
  { kind: 'teaching', title: 'Teaching', label: 'Classrooms' },
  { kind: 'leadership', title: 'Leadership', label: 'Beyond class' },
] as const;

export const education = [
  {
    school: 'University of Michigan',
    degree: 'B.S. Data Science',
    period: '2023 — 2027 (expected)',
    /** Leave empty to omit the line. */
    gpa: '',
  },
] as const;

export const skills = [
  { group: 'Languages', items: ['Python', 'C++', 'TypeScript', 'C', 'SQL', 'Bash'] },
  { group: 'Data', items: ['NumPy', 'Pandas', 'SciPy', 'Matplotlib', 'Excel'] },
  {
    group: 'ML Systems',
    items: ['PyTorch', 'Hugging Face', 'OpenCV', 'Quantization'],
  },
  { group: 'Infrastructure', items: ['Git', 'Linux', 'Docker', 'CMake', 'Slurm', 'LaTeX'] },
] as const;

export const awards = [
  { title: 'University Honors', org: 'University of Michigan', year: '2024' },
] as const;

/** The "Away from the keyboard" cards on the home page. */
export const interests = [
  {
    title: 'Basketball',
    icon: 'basketball',
    body: "I didn't make it as a pro, but basketball taught me a lot about team cohesion. These days I'm working on jumping higher, shooting more accurately on the move, and controlling my body.",
  },
  {
    title: 'Philosophy',
    icon: 'book',
    body: "I'm curious about how social common sense forms.\nWhy do so many people hold on to beliefs that seem wrong?\nHow do cultures meet and blend into something new?",
  },
  {
    title: 'Cooking',
    icon: 'pot',
    body: 'Cooking for my family and friends.\nI treat cooking like programming, with ingredients as the variables I control. (Nerddd alert!)',
  },
] as const;

/** The dated "Now" block on the home page. */
export const now = {
  updated: '2026-10-14',
  items: [
    'Optimizing local LLM serving: quantization, speculative decoding, and measuring what actually makes inference faster.',
    'Researching subagents: how an AI agent can split a complex task across smaller, specialized agents and combine their results.',
    "Preparing master's and PhD applications in computer science, AI + X, and finance for autumn 2027 entry.",
  ],
} as const;
