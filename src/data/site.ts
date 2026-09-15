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
 * │ 3. Drop your CV PDF at `public/edward-wu-cv.pdf` (or clear `cv`).     │
 * │ 4. `education[].gpa` — fill in or delete the field.                   │
 * └───────────────────────────────────────────────────────────────────────┘
 */

export const profile = {
  name: 'Edward Wu',
  /** Rendered as the small mono line under the name. Keep it to three beats. */
  discipline: ['Experimental Physics', 'Scientific Computing', 'AI Systems'],
  role: 'Physics & CS',
  affiliation: 'University of Michigan',
  location: 'Ann Arbor, Michigan',
  timezone: 'America/Detroit',
  /** Small status pill in the hero. Set to '' to hide it. */
  status: 'Applying to PhD programs · open to 2027 internships',
  /** One sentence. Used for <meta name="description"> and link previews. */
  description:
    'Edward Wu — undergraduate at the University of Michigan working on detector simulation, large-scale experimental data analysis, and the performance of modern ML systems.',
  /** Hero paragraphs. The first one is set larger than the rest. */
  intro: [
    'I work at the boundary between experimental physics and computation — detector simulation, large-scale data analysis, and the systems engineering that makes modern machine learning fast.',
    'The problems I like are the ones where a careful physical model and a fast implementation have to meet in the middle: reconstructing what a detector actually saw, or getting a generative model to run an order of magnitude quicker on the hardware already sitting in front of me.',
  ],
} as const;

export const contact = {
  // TODO: replace with your real address before deploying.
  email: 'edward.wu@umich.edu',
  /** Put a PDF at `public/edward-wu-cv.pdf`, or set to '' to hide the button. */
  cv: '/edward-wu-cv.pdf',
} as const;

export const socials = [
  { label: 'Email', handle: contact.email, href: `mailto:${contact.email}` },
  { label: 'GitHub', handle: '@edwardwu', href: 'https://github.com/edwardwu' },
  { label: 'LinkedIn', handle: '/in/edwardwu', href: 'https://www.linkedin.com/in/edwardwu' },
  { label: 'Scholar', handle: 'Publications', href: 'https://scholar.google.com/citations?user=' },
] as const;

export const nav = [
  { href: '/', label: 'Home' },
  { href: '/research', label: 'Research' },
  { href: '/projects', label: 'Projects' },
  { href: '/writing', label: 'Writing' },
  { href: '/resume', label: 'CV' },
  { href: '/about', label: 'About' },
] as const;

/** Three-up grid on the home page. */
export const focus = [
  {
    title: 'Detector Simulation',
    body: 'Gaseous straw-tube detectors, primary ionization statistics, and cluster counting for particle identification.',
    tags: ['Garfield++', 'ROOT', 'C++'],
  },
  {
    title: 'Experimental Analysis',
    body: 'Test-beam data, calibration pipelines, timing and charge reconstruction, and analysis tooling other people can actually use.',
    tags: ['Python', 'NumPy', 'Statistics'],
  },
  {
    title: 'AI Systems',
    body: 'Inference performance for generative models: quantization, memory layout, kernel behaviour, and honest GPU utilization numbers.',
    tags: ['PyTorch', 'CUDA', 'Triton'],
  },
] as const;

/** Headline numbers for the hero readout panel. */
export const readout = [
  { key: 'Focus', value: 'Detector simulation · ML systems' },
  { key: 'Based', value: 'Ann Arbor, MI' },
  { key: 'Status', value: 'Open to research collaborations' },
] as const;

export const education = [
  {
    school: 'University of Michigan',
    degree: 'B.S. Physics and Computer Science',
    period: '2023 — 2027 (expected)',
    location: 'Ann Arbor, MI',
    /** Delete this line if you'd rather not publish it. */
    gpa: '',
    details: [
      'Physics: Quantum Mechanics I/II, Statistical & Thermal Physics, Electricity & Magnetism, Experimental Physics.',
      'Computing: Data Structures & Algorithms, Computer Architecture, Numerical Methods, Machine Learning.',
    ],
  },
] as const;

export const research = [
  {
    title: 'Straw-Tube Detector Simulation',
    org: 'University of Michigan',
    role: 'Undergraduate Researcher',
    period: '2024 — Present',
    summary:
      'Simulation studies of gaseous straw-tube detectors for particle identification by cluster counting.',
    bullets: [
      'Modelled gas mixtures and operating conditions in Garfield++ to characterise primary ionization cluster density and its event-to-event fluctuations.',
      'Quantified π/K separation power as a function of momentum, track length, and cluster-counting efficiency.',
      'Built a reproducible simulation and analysis pipeline in C++ and Python on top of ROOT, so a full parameter scan re-runs from one config file.',
    ],
    tags: ['Garfield++', 'ROOT', 'C++', 'Python'],
  },
  {
    title: 'Scintillator Test-Beam Analysis',
    org: 'University of Michigan',
    role: 'Undergraduate Researcher',
    period: '2024 — Present',
    summary: 'Calibration and response studies on experimental scintillator detector data.',
    bullets: [
      'Processed test-beam runs end to end: pedestal subtraction, charge integration, and per-channel gain calibration.',
      'Studied channel-to-channel correlations and timing resolution across operating configurations.',
      'Packaged the analysis into shared tooling now used by other members of the group.',
    ],
    tags: ['Python', 'ROOT', 'Signal Processing'],
  },
] as const;

export const projects = [
  {
    title: 'Diffusion Inference Profile',
    period: '2026',
    summary:
      'An end-to-end study of inference performance for a large text-to-image diffusion model on a single consumer GPU.',
    bullets: [
      'Profiled the sampling loop to separate attention, convolution, and memory-bound stages, then attacked them in order of measured cost.',
      'Compared quantization schemes against a fixed-seed quality baseline instead of eyeballing outputs.',
      'Documented the real tradeoff surface between latency, VRAM footprint, and perceptual quality.',
    ],
    tags: ['PyTorch', 'CUDA', 'Quantization'],
    href: '',
    featured: true,
  },
  {
    title: 'Detector Analysis Toolkit',
    period: '2025',
    summary: 'A small library that turns raw detector runs into calibrated, plot-ready datasets.',
    bullets: [
      'Declarative run configuration, so a full calibration is reproducible from a single file.',
      'Vectorised readers that keep multi-gigabyte runs out of resident memory.',
    ],
    tags: ['Python', 'NumPy', 'Uproot'],
    href: '',
    featured: true,
  },
  {
    title: 'This Website',
    period: '2026',
    summary:
      'A static site with no framework runtime: hand-built design system, self-hosted subset fonts, build-time social cards, and a generative hero drawn on canvas.',
    bullets: [
      'Astro with zero client-side framework JavaScript — every interaction is a small vanilla module bound on page load.',
      'Open Graph cards rendered at build time with Satori, so every page has its own social image.',
    ],
    tags: ['Astro', 'TypeScript', 'CSS'],
    href: 'https://github.com/edwardwu',
    featured: false,
  },
] as const;

export const skills = [
  { group: 'Languages', items: ['Python', 'C++', 'TypeScript', 'C', 'SQL', 'Bash'] },
  { group: 'Scientific', items: ['ROOT', 'Garfield++', 'NumPy', 'SciPy', 'Uproot', 'Matplotlib'] },
  { group: 'ML Systems', items: ['PyTorch', 'CUDA', 'Triton', 'Hugging Face', 'Quantization'] },
  { group: 'Infrastructure', items: ['Git', 'Linux', 'Docker', 'CMake', 'Slurm', 'LaTeX'] },
] as const;

/** Flat list for the home-page marquee. */
export const toolbelt = skills.flatMap((group) => group.items);

export const awards = [
  { title: 'James B. Angell Scholar', org: 'University of Michigan', year: '2025' },
  { title: 'University Honors', org: 'University of Michigan', year: '2024' },
] as const;

/** The personal side — this is the part that makes the site yours. */
export const interests = [
  {
    title: 'Instruments and Optics',
    body: 'I like machines that measure things. Detectors, telescopes, cameras — anything where a physical effect is coaxed into becoming a number you can trust.',
  },
  {
    title: 'Computational Art',
    body: 'Generative drawing, plotter art, and simulation as a visual medium. The hero on the home page is a particle-track field drawn one frame at a time.',
  },
  {
    title: 'Reading',
    body: 'History of science, long-form technical writing, and the occasional novel that has nothing to do with either.',
  },
  {
    title: 'Outdoors',
    body: 'Hiking and long walks around Ann Arbor. Most of my ideas about a stuck problem arrive somewhere in the third mile.',
  },
] as const;

/** Rendered on /about as a dated "what I'm doing now" list. */
export const now = {
  updated: '2026-09-01',
  items: [
    'Running the current gas-mixture scan for the cluster-counting study and writing up the separation-power curves.',
    'Reading through Triton kernels to understand where a fused attention implementation actually wins.',
    'Preparing PhD applications for autumn 2027 entry.',
  ],
} as const;
