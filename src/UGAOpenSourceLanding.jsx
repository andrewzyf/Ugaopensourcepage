import { Fragment, useCallback, useEffect, useId, useRef, useState } from 'react';
import './landing.css';

/**
 * UGA Open Source — landing showcase.
 *
 * One self-contained component: data, hooks, icons and sections all live in
 * this file; styles live in landing.css (scoped under `.uos`). No animation
 * library — motion is CSS transitions/keyframes driven by IntersectionObserver
 * and a single rAF-throttled scroll/pointer handler, and everything collapses
 * to static under `prefers-reduced-motion`.
 *
 * Brand comes straight from the production app (src/styles/tokens.css):
 * one green accent (#1d7a6e) on warm cream paper, deep green-black for dark,
 * Lora for display type, the system sans for everything else, and the
 * per-subject two-tone hues from lib/hues.ts.
 *
 * Props
 *   appUrl     — where the live library lives (links are built from it).
 *   liveStats  — optional { materials, students } from the app's
 *                `site_stats()` RPC. When given, they join the counters.
 */

const APP_URL = 'https://ugaopensource.vercel.app';
const INSTAGRAM = 'https://www.instagram.com/ugaopensource';

/* ------------------------------------------------------------------ data */

const SUBJECTS = [
  { id: 'math', name: 'Mathematics', topics: 'Calculus · Trigonometry', ink: '#1d7a6e', tint: '#dff0ea' },
  { id: 'chem', name: 'Chemistry', topics: 'Organic · Stoichiometry', ink: '#a4622a', tint: '#fbeade' },
  { id: 'phys', name: 'Physics', topics: 'Mechanics · Waves & optics', ink: '#3a4691', tint: '#e6e8f8' },
  { id: 'bio', name: 'Biology', topics: 'Cells · Genetics', ink: '#4b7b2f', tint: '#e6f1dc' },
  { id: 'hist', name: 'History', topics: 'The Cold War', ink: '#8f3a45', tint: '#f9e3e6' },
  { id: 'eng', name: 'English', topics: 'Prose analysis', ink: '#6a4a8f', tint: '#ece4f6' },
  { id: 'econ', name: 'Economics', topics: 'Fiscal & monetary policy', ink: '#1f6b86', tint: '#dceaf1' },
  { id: 'geo', name: 'Geography', topics: 'Rivers & coasts', ink: '#8a7320', tint: '#f6efd4' },
];
const SUBJECT = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));

const TYPES = ['Notes', 'Summary', 'Flashcards', 'Practice Questions'];
const TYPE_HUE = {
  Notes: { ink: '#155e54', tint: '#dff0ea' },
  Summary: { ink: '#8a5320', tint: '#fdeedd' },
  Flashcards: { ink: '#3a4691', tint: '#e6e8f8' },
  'Practice Questions': { ink: '#8f3a45', tint: '#f9e3e6' },
};

/** The library's sample set (supabase/seed_demo.sql in the app repo). */
const MATERIALS = [
  { id: 1, title: 'Calculus I — Limits, Continuity and the Derivative', subject: 'math', type: 'Notes', level: 'Form 5', pages: 42, downloads: 1284, ext: 'PDF',
    description: 'Full term notes rewritten from lectures and the course reader. Worked examples for every rule, with the epsilon-delta section kept short and practical. The last eight pages are past-paper questions with full solutions.' },
  { id: 2, title: 'Organic Chemistry — Reaction Mechanisms Summary', subject: 'chem', type: 'Summary', level: 'Form 6', pages: 18, downloads: 973, ext: 'PDF',
    description: 'One page per mechanism family: substitution, elimination, addition, rearrangement. Arrows drawn by hand and redrawn cleanly. Made for the week before the exam, not for first learning.' },
  { id: 3, title: 'The Cold War, 1945–1991 — Timeline and Key Debates', subject: 'hist', type: 'Notes', level: 'Form 6', pages: 31, downloads: 640, ext: 'DOCX',
    description: 'Chronology on the left, historiography on the right, so you can revise events and interpretations together. Includes a short glossary of terms that come up in essay questions.' },
  { id: 4, title: 'Cell Biology — Mitosis and Meiosis Flashcards', subject: 'bio', type: 'Flashcards', level: 'Form 4', pages: 96, downloads: 812, ext: 'PDF',
    description: 'Ninety-six two-sided cards covering both processes stage by stage, plus the differences most often asked about in exams. Print double-sided on A4 and cut along the guides.' },
  { id: 5, title: 'Mechanics — Forces, Momentum and Energy Problem Set', subject: 'phys', type: 'Practice Questions', level: 'Form 5', pages: 24, downloads: 559, ext: 'PDF',
    description: 'Sixty problems arranged from routine to hard, with answers at the back and full workings for the twelve hardest. Diagrams for every question.' },
  { id: 6, title: 'Macroeconomics — Fiscal and Monetary Policy Notes', subject: 'econ', type: 'Notes', level: 'Form 6', pages: 27, downloads: 431, ext: 'PDF',
    description: 'Covers the policy toolkit, transmission mechanisms and the standard critiques. Each section ends with a two-line summary you can memorise.' },
  { id: 7, title: 'Essay Structure for Prose Analysis', subject: 'eng', type: 'Summary', level: 'Form 4', pages: 9, downloads: 388, ext: 'DOCX',
    description: 'A short guide to building an argument about a passage: how to open, how to quote, how to close. Two annotated sample essays included.' },
  { id: 8, title: 'Trigonometry — Identities and Proofs Practice', subject: 'math', type: 'Practice Questions', level: 'Form 4', pages: 15, downloads: 502, ext: 'PDF',
    description: 'Every standard identity with three proof exercises each. Solutions use only the identities introduced before them, so it works as a sequence.' },
  { id: 9, title: 'Physical Geography — Rivers and Coastal Processes', subject: 'geo', type: 'Notes', level: 'Form 3', pages: 22, downloads: 297, ext: 'PPTX',
    description: 'Slide notes from a term of fieldwork prep, with labelled cross-sections and the case studies our syllabus asks for.' },
  { id: 10, title: 'Stoichiometry — Moles, Concentration and Yield', subject: 'chem', type: 'Practice Questions', level: 'Form 4', pages: 12, downloads: 610, ext: 'PDF',
    description: 'Drill sheet. Forty calculations in increasing difficulty, answers to three significant figures, common mistakes flagged in the margin.' },
  { id: 11, title: 'Genetics — Inheritance Patterns Summary', subject: 'bio', type: 'Summary', level: 'Form 5', pages: 11, downloads: 344, ext: 'PDF',
    description: 'Monohybrid through to sex-linked inheritance on eleven pages, each with one worked Punnett square and one exam-style question.' },
  { id: 12, title: 'Waves and Optics — Definitions Flashcards', subject: 'phys', type: 'Flashcards', level: 'Form 3', pages: 60, downloads: 268, ext: 'PDF',
    description: 'Sixty cards of terms and formulae, sorted by topic so you can revise one section at a time.' },
];

const THREADS = [
  { title: 'Which Calculus notes actually cover the Form 5 syllabus?', tag: 'Question', replies: 2, ago: '2 days ago',
    reply: 'Print the newer one and use the old one for extra practice questions. That is what I did last term.' },
  { title: 'Requesting: Geography case studies for coastal management', tag: 'Request', replies: 1, ago: '4 days ago',
    reply: 'I have three written up. Will clean them and upload this weekend.' },
  { title: 'How do you actually revise from flashcards?', tag: 'Discussion', replies: 2, ago: '7 days ago',
    reply: 'Split by topic, then shuffle everything once a week. Sorting them into piles by what you got wrong helps more than repeating the whole deck.' },
];

const TAG_HUE = { Question: TYPE_HUE.Notes, Request: TYPE_HUE.Summary, Discussion: TYPE_HUE.Flashcards };

const GUIDELINES = [
  { title: 'Upload only your own work', body: 'Your notes, your summaries, your flashcards. Please do not upload textbooks, past papers you do not own, or anything copied from a paid resource.' },
  { title: 'Name it the way you would search for it', body: 'Subject, topic, then what it is. “Calculus I — Limits and Derivatives” beats “notes final v3”.' },
  { title: 'Say what it covers', body: 'A two-line description saves other students a download. Mention the term, the syllabus, and anything incomplete.' },
  { title: 'Keep other people out of it', body: 'No names, photos, student numbers or private messages in the file. Check the margins before you upload.' },
  { title: 'Fix or remove what is wrong', body: 'If someone reports an error, replace the file. Materials with unresolved reports are taken down.' },
];

/** Before/after: the same nine files, as they live in a group chat and as they live here. */
const CHAOS = [
  { subject: 'math', type: 'Notes', messy: 'notes final v3.pdf', tidy: 'Calculus I — Limits and the Derivative', at: [2, 6, -8] },
  { subject: 'math', type: 'Practice Questions', messy: 'IMG_4031.jpg', tidy: 'Trigonometry — Identities Practice', at: [60, 2, 6] },
  { subject: 'math', type: 'Summary', messy: 'calc (1) (2).docx', tidy: 'Integration — One-page Summary', at: [30, 68, -3] },
  { subject: 'chem', type: 'Summary', messy: 'chem stuff.pdf', tidy: 'Organic — Reaction Mechanisms', at: [36, 20, 11] },
  { subject: 'chem', type: 'Practice Questions', messy: 'Fwd: stoich answers', tidy: 'Stoichiometry — Moles and Yield', at: [66, 44, -12] },
  { subject: 'chem', type: 'Flashcards', messy: 'bonding??.pptx', tidy: 'Bonding — Key Terms', at: [4, 40, 5] },
  { subject: 'bio', type: 'Flashcards', messy: 'scan0007.pdf', tidy: 'Mitosis and Meiosis Flashcards', at: [52, 78, 9] },
  { subject: 'bio', type: 'Summary', messy: 'bio summary REAL.docx', tidy: 'Genetics — Inheritance Patterns', at: [8, 80, -14] },
  { subject: 'bio', type: 'Notes', messy: 'ecology (from gc).pdf', tidy: 'Ecology — Food Webs Notes', at: [68, 22, -4] },
];
const CHAOS_COLS = ['math', 'chem', 'bio'];

const FLASHCARDS = [
  { q: 'What does mitosis produce?', a: 'Two daughter cells, each diploid and genetically identical to the parent.' },
  { q: 'In which phase do chromosomes line up across the middle of the cell?', a: 'Metaphase.' },
  { q: 'When does crossing over happen?', a: 'Prophase I of meiosis — homologous chromosomes swap sections of DNA.' },
  { q: 'How many cells does meiosis produce?', a: 'Four haploid cells, each genetically different.' },
];

const QUESTIONS = [
  { q: 'A 2 kg trolley moves at 3 m/s. What is its momentum?', options: ['1.5 kg·m/s', '5 kg·m/s', '6 kg·m/s', '18 kg·m/s'], answer: 2,
    working: 'p = mv = 2 × 3 = 6 kg·m/s' },
  { q: 'A net force of 10 N acts on a 5 kg block. What is its acceleration?', options: ['0.5 m/s²', '2 m/s²', '15 m/s²', '50 m/s²'], answer: 1,
    working: 'a = F / m = 10 / 5 = 2 m/s²' },
  { q: 'What is the kinetic energy of that 2 kg trolley at 3 m/s?', options: ['3 J', '6 J', '9 J', '18 J'], answer: 2,
    working: 'Eₖ = ½mv² = ½ × 2 × 3² = 9 J' },
];

const NAV = [
  { id: 'why', label: 'Why' },
  { id: 'library', label: 'Library' },
  { id: 'resources', label: 'Resources' },
  { id: 'how', label: 'How it works' },
  { id: 'community', label: 'Community' },
];

/* ----------------------------------------------------------------- hooks */

function useReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** True once (or while, with once=false) the element is on screen. */
function useInView({ threshold = 0.3, once = true, rootMargin = '0px' } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once, rootMargin]);
  return [ref, inView];
}

/** One observer for every static `[data-reveal]` element under root. */
function useRevealAll(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const els = root.querySelectorAll('[data-reveal]');
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rootRef]);
}

/** Eases from `from` to `to` once `active` flips true. */
function useCountUp(to, active, { from = 0, duration = 1700 } = {}) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(from);
  useEffect(() => {
    if (!active) return undefined;
    if (reduced) {
      setValue(to);
      return undefined;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(2, -10 * t); // easeOutExpo
      setValue(Math.round(from + (to - from) * (t === 1 ? 1 : eased)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, from, active, duration, reduced]);
  return value;
}

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('uos-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      /* storage blocked — fall through to the system preference */
    }
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });
  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('uos-theme', next);
      } catch {
        /* non-essential */
      }
      return next;
    });
  }, []);
  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  return [theme, toggle];
}

/** Cursor-following spotlight: writes --x/--y on the hovered element. */
function spotlight(e) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
}

const fmt = (n) => n.toLocaleString('en-US');

/* ----------------------------------------------------------------- icons */

function Icon({ name, size = 18, strokeWidth = 1.4, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}

const ICONS = {
  folder: <path d="M2 4.6h4.2l1.2 1.4H14v6.4H2z" />,
  chat: <path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" />,
  doc: <path d="M4 2.5h5.5L12 5v8.5H4zM9.5 2.5V5H12M6 8h4M6 10.5h4" />,
  shield: <path d="M8 2.2 13 4v4c0 3-2.2 5-5 5.8C5.2 13 3 11 3 8V4zM5.8 8l1.6 1.6L10.4 6.6" />,
  search: (
    <>
      <circle cx="7" cy="7" r="4.2" />
      <path d="M10.2 10.2 13.5 13.5" />
    </>
  ),
  download: <path d="M8 2.8v8.4M4.5 7.7 8 11.2l3.5-3.5M3 13.5h10" />,
  upload: <path d="M8 11.5V3.3M4.5 6.8 8 3.3l3.5 3.5M3 13.5h10" />,
  star: <path d="m8 2.4 1.7 3.5 3.8.5-2.8 2.7.7 3.8L8 11.1l-3.4 1.8.7-3.8-2.8-2.7 3.8-.5z" />,
  arrow: <path d="M3 8h10M9 4l4 4-4 4" />,
  sun: (
    <>
      <circle cx="8" cy="8" r="2.8" />
      <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" />
    </>
  ),
  moon: <path d="M13 9.6A5.5 5.5 0 0 1 6.4 3a5.5 5.5 0 1 0 6.6 6.6z" />,
  menu: <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />,
  close: <path d="M4 4l8 8M12 4l-8 8" />,
  check: <path d="M3.5 8.4 6.6 11.5 12.5 4.8" />,
  cards: <path d="M4.5 4.5h8v8h-8zM3.5 11.5v-8h8" />,
  question: (
    <>
      <circle cx="8" cy="8" r="5.8" />
      <path d="M6.3 6.3a1.8 1.8 0 1 1 2.4 1.7c-.5.2-.7.6-.7 1.1v.3M8 11.4v.1" />
    </>
  ),
  list: <path d="M5.5 4.5h8M5.5 8h8M5.5 11.5h8M2.5 4.5h.1M2.5 8h.1M2.5 11.5h.1" />,
  heart: <path d="M8 13.2S2.5 10 2.5 6.1A2.8 2.8 0 0 1 8 4.8a2.8 2.8 0 0 1 5.5 1.3C13.5 10 8 13.2 8 13.2z" />,
  open: <path d="M5.5 3H3v10h10v-2.5M8.5 3H13v4.5M13 3 7 9" />,
  instagram: (
    <>
      <rect x="2.5" y="2.5" width="11" height="11" rx="3.2" />
      <circle cx="8" cy="8" r="2.6" />
      <path d="M11.3 4.7v.1" />
    </>
  ),
  spark: <path d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l1.8 1.8M10.2 10.2 12 12M12 4l-1.8 1.8M5.8 10.2 4 12" />,
};

/* ------------------------------------------------------------ primitives */

function Mark({ size = 30 }) {
  return (
    <span className="mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <rect width="32" height="32" rx="9" fill="var(--green)" />
        <path d="M7.5 11h6.5l2 2.4h8.5V23.5h-17z" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
        <path d="M11.5 18.2h9" stroke="#fff" strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/** Link-styled button with a magnetic pull and a click ripple. */
function MagneticButton({ as: Tag = 'a', variant = 'primary', size = 'lg', className = '', children, onClick, ...rest }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  const onMove = (e) => {
    if (reduced || e.pointerType !== 'mouse') return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    el.style.setProperty('--tx', `${dx * 8}px`);
    el.style.setProperty('--ty', `${dy * 6}px`);
    spotlight(e);
  };
  const onLeave = () => {
    ref.current?.style.setProperty('--tx', '0px');
    ref.current?.style.setProperty('--ty', '0px');
  };
  const handleClick = (e) => {
    const el = ref.current;
    if (el && !reduced) {
      const r = el.getBoundingClientRect();
      const ripple = document.createElement('span');
      const d = Math.max(r.width, r.height) * 2;
      ripple.className = 'ripple';
      ripple.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
      el.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    }
    onClick?.(e);
  };

  return (
    <Tag
      ref={ref}
      className={`btn btn--${variant} btn--${size} ${className}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={handleClick}
      {...rest}
    >
      <span className="btn-label">{children}</span>
    </Tag>
  );
}

function hueStyle(h) {
  return { '--hue': h.ink, '--hue-tint': h.tint };
}

function TypeBadge({ type, small }) {
  return (
    <span className={`badge hue ${small ? 'badge--sm' : ''}`} style={hueStyle(TYPE_HUE[type])}>
      {type}
    </span>
  );
}

function FileChip({ ext, size = 'md' }) {
  return <span className={`file-chip file-chip--${size}`}>{ext}</span>;
}

/* ================================================================= page */

export default function UGAOpenSourceLanding({ appUrl = APP_URL, liveStats } = {}) {
  const [theme, toggleTheme] = useTheme();
  const rootRef = useRef(null);
  const reduced = useReducedMotion();
  useRevealAll(rootRef);

  const url = (path = '') => `${appUrl.replace(/\/$/, '')}${path}`;

  return (
    <div className="uos" data-theme={theme} ref={rootRef}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Nav theme={theme} onToggleTheme={toggleTheme} url={url} />
      <main id="main">
        <Hero url={url} reduced={reduced} />
        <SubjectMarquee />
        <Problem />
        <Library url={url} />
        <Resources />
        <HowItWorks reduced={reduced} />
        <Features />
        <Stats liveStats={liveStats} />
        <Community url={url} />
        <FinalCta url={url} />
      </main>
      <Footer url={url} />
    </div>
  );
}

/* ------------------------------------------------------------------ nav */

function Nav({ theme, onToggleTheme, url }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const progressRef = useRef(null);

  // One rAF-throttled scroll handler: progress bar + glass state.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      }
      setScrolled(y > 16);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Highlight the section in the middle of the viewport.
  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(Boolean);
    if (!sections.length || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''} ${open ? 'nav--open' : ''}`}>
      <div className="nav-inner">
        <a className="brand" href="#top" onClick={() => setOpen(false)}>
          <Mark size={28} />
          <span className="brand-name">UGA Open Source</span>
        </a>

        <nav className="nav-links" aria-label="Sections">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={active === n.id ? 'is-active' : ''}
              aria-current={active === n.id ? 'true' : undefined}
              onClick={() => setOpen(false)}
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className={`theme-swap ${theme === 'dark' ? 'is-dark' : ''}`}>
              <Icon name="sun" size={17} />
              <Icon name="moon" size={17} />
            </span>
          </button>
          <MagneticButton href={url('/')} size="sm" className="nav-cta">
            Open the library
          </MagneticButton>
          <button
            type="button"
            className="icon-btn nav-burger"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? 'close' : 'menu'} size={18} />
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!open}>
        {NAV.map((n, i) => (
          <a key={n.id} href={`#${n.id}`} style={{ '--i': i }} onClick={() => setOpen(false)}>
            {n.label}
            <Icon name="arrow" size={16} />
          </a>
        ))}
        <MagneticButton href={url('/')} size="md">
          Open the library
        </MagneticButton>
      </div>

      <div className="progress" aria-hidden="true">
        <span ref={progressRef} />
      </div>
    </header>
  );
}

/* ----------------------------------------------------------------- hero */

const HEADLINE = 'Study notes, shared by the students who wrote them.';

function Hero({ url, reduced }) {
  const heroRef = useRef(null);

  // Pointer + scroll parallax, written straight to CSS variables.
  useEffect(() => {
    const el = heroRef.current;
    if (!el || reduced) return undefined;
    let raf = 0;
    let mx = 0;
    let my = 0;
    const paint = () => {
      raf = 0;
      el.style.setProperty('--mx', mx.toFixed(3));
      el.style.setProperty('--my', my.toFixed(3));
      el.style.setProperty('--sy', Math.min(window.scrollY, 1200).toFixed(0));
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width) * 2 - 1;
      my = ((e.clientY - r.top) / r.height) * 2 - 1;
      queue();
    };
    const onLeave = () => {
      mx = 0;
      my = 0;
      queue();
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    window.addEventListener('scroll', queue, { passive: true });
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', queue);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const words = HEADLINE.split(' ');

  return (
    <section id="top" className="hero" ref={heroRef} aria-labelledby="hero-title">
      <div className="hero-bg" aria-hidden="true">
        <span className="orb orb--1" />
        <span className="orb orb--2" />
        <span className="orb orb--3" />
        <span className="hero-rules" />
        <span className="grain" />
      </div>

      <div className="hero-inner container">
        <div className="hero-copy">
          <p className="pill rise" style={{ '--d': '40ms' }}>
            <span className="pill-dot" />
            Student-run · Free · Open to every classmate
          </p>

          <h1 id="hero-title" className="hero-title">
            {words.map((w, i) => (
              <Fragment key={i}>
                <span className="word" style={{ '--d': `${120 + i * 55}ms` }}>
                  <span>{w === 'shared' ? <em>{w}</em> : w}</span>
                </span>{' '}
              </Fragment>
            ))}
          </h1>

          <p className="hero-sub rise" style={{ '--d': '640ms' }}>
            A free library of notes, summaries, flashcards and practice questions — organised by subject, written
            by classmates, and passed on to whoever needs them next.
          </p>

          <div className="hero-actions rise" style={{ '--d': '760ms' }}>
            <MagneticButton href={url('/')}>
              Browse the library
              <Icon name="arrow" size={16} strokeWidth={1.8} className="btn-arrow" />
            </MagneticButton>
            <MagneticButton href={url('/upload')} variant="glass">
              <Icon name="upload" size={16} strokeWidth={1.7} />
              Share your notes
            </MagneticButton>
          </div>

          <ul className="hero-proof rise" style={{ '--d': '880ms' }}>
            <li>
              <Icon name="check" size={14} strokeWidth={2} /> No ads, no paywall
            </li>
            <li>
              <Icon name="check" size={14} strokeWidth={2} /> PDFs, docs, slides, images
            </li>
            <li>
              <Icon name="check" size={14} strokeWidth={2} /> Sign in with school email or Google
            </li>
          </ul>
        </div>

        <div className="hero-stage rise" style={{ '--d': '380ms' }} aria-hidden="true">
          <AppMock />
          <div className="float float--card depth-2">
            <span className="float-eyebrow">Flashcard · Biology</span>
            <span className="float-q">When does crossing over happen?</span>
            <span className="float-hint">Tap to flip</span>
          </div>
          <div className="float float--stat depth-3">
            <span className="float-icon">
              <Icon name="download" size={15} strokeWidth={1.7} />
            </span>
            <span>
              <strong>1,284</strong> downloads
              <small>Calculus I — Notes</small>
            </span>
          </div>
          <div className="float float--toast depth-1">
            <span className="float-check">
              <Icon name="check" size={13} strokeWidth={2.2} />
            </span>
            Published to <strong>Chemistry</strong>
          </div>
        </div>
      </div>

      <a className="scroll-cue" href="#why" aria-label="Scroll to learn more">
        <span />
      </a>
    </section>
  );
}

function AppMock() {
  const rows = [MATERIALS[1], MATERIALS[3], MATERIALS[4], MATERIALS[2]];
  return (
    <div className="mock">
      <div className="mock-bar">
        <span className="mock-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="mock-url">ugaopensource.vercel.app</span>
      </div>
      <div className="mock-body">
        <div className="mock-side">
          <div className="mock-brand">UGA Open Source</div>
          <div className="mock-new">
            <span>+</span> New upload
          </div>
          <div className="mock-nav is-on">
            <Icon name="folder" size={12} /> Library
          </div>
          <div className="mock-nav">
            <Icon name="star" size={12} /> Saved
          </div>
          <div className="mock-nav">
            <Icon name="chat" size={12} /> Discuss
          </div>
          <div className="mock-nav">
            <Icon name="doc" size={12} /> Workspace
          </div>
          <div className="mock-label">Subjects</div>
          {SUBJECTS.slice(0, 6).map((s) => (
            <div className="mock-subj" key={s.id}>
              <i style={{ background: s.ink }} />
              {s.name}
            </div>
          ))}
        </div>
        <div className="mock-main">
          <div className="mock-search">
            <Icon name="search" size={12} /> Search notes, flashcards, subjects…
          </div>
          <div className="mock-chips">
            <span className="is-on">All</span>
            <span>Notes</span>
            <span>Summary</span>
            <span>Flashcards</span>
          </div>
          <div className="mock-featured hue" style={hueStyle(SUBJECT.math)}>
            <span className="mock-featured-eyebrow">Most downloaded this week</span>
            <span className="mock-featured-title">Calculus I — Limits, Continuity and the Derivative</span>
            <span className="mock-featured-meta">Mathematics · Notes · 42 pages</span>
          </div>
          {rows.map((m) => (
            <div className="mock-row" key={m.id}>
              <FileChip ext={m.ext} size="xs" />
              <span className="mock-row-text">
                <span className="mock-row-title">{m.title}</span>
                <span className="mock-row-meta">
                  {SUBJECT[m.subject].name} · {m.level}
                </span>
              </span>
              <TypeBadge type={m.type} small />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- marquee */

function SubjectMarquee() {
  const items = [...SUBJECTS, ...SUBJECTS];
  return (
    <div className="marquee" aria-label="Subjects in the library">
      <div className="marquee-track">
        {items.map((s, i) => (
          <span className="marquee-item hue" style={hueStyle(s)} key={i} aria-hidden={i >= SUBJECTS.length}>
            <i />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- problem */

function Problem() {
  const [stageRef, inView] = useInView({ threshold: 0.45 });
  const [tidy, setTidy] = useState(false);
  const touched = useRef(false);

  useEffect(() => {
    if (!inView || touched.current) return undefined;
    const t = setTimeout(() => setTidy(true), 900);
    return () => clearTimeout(t);
  }, [inView]);

  const choose = (v) => {
    touched.current = true;
    setTidy(v);
  };

  const perCol = {};
  const placed = CHAOS.map((c) => {
    const col = CHAOS_COLS.indexOf(c.subject);
    const row = (perCol[c.subject] = (perCol[c.subject] ?? -1) + 1);
    return { ...c, col, row };
  });

  return (
    <section id="why" className="section problem" aria-labelledby="why-title">
      <div className="container problem-grid">
        <div className="problem-copy">
          <p className="eyebrow" data-reveal>
            The problem
          </p>
          <h2 id="why-title" className="section-title" data-reveal>
            Someone in your year has already written the notes you need.
          </h2>
          <p className="lede" data-reveal>
            They&rsquo;re just buried — forty messages up a group chat, called <code>notes final v3.pdf</code>,
            on a laptop you&rsquo;ll never see. UGA Open Source gives them somewhere to live.
          </p>

          <ul className="swap-list">
            {[
              ['Scattered across chats and drives', 'One folder per subject'],
              ['Named “scan0007”', 'Named the way you’d search for it'],
              ['Passed around to whoever asks', 'Open to every classmate, free'],
            ].map(([before, after], i) => (
              <li key={i} data-reveal style={{ '--d': `${i * 90}ms` }}>
                <span className="swap-before">{before}</span>
                <Icon name="arrow" size={15} />
                <span className="swap-after">{after}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="chaos-wrap" data-reveal>
          <div className="segmented" role="group" aria-label="Compare">
            <span className="segmented-pill" style={{ transform: `translateX(${tidy ? 100 : 0}%)` }} />
            <button type="button" aria-pressed={!tidy} onClick={() => choose(false)}>
              Group chat
            </button>
            <button type="button" aria-pressed={tidy} onClick={() => choose(true)}>
              UGA Open Source
            </button>
          </div>

          <div ref={stageRef} className={`chaos ${tidy ? 'is-tidy' : ''}`} aria-live="polite">
            <span className="sr-only">
              {tidy ? 'Files organised into subject folders.' : 'Files scattered with unhelpful names.'}
            </span>
            {CHAOS_COLS.map((id, i) => (
              <span
                key={id}
                className="chaos-folder hue"
                style={{ ...hueStyle(SUBJECT[id]), '--col': i }}
                aria-hidden="true"
              >
                <Icon name="folder" size={14} />
                {SUBJECT[id].name}
              </span>
            ))}
            {placed.map((c, i) => (
              <div
                key={c.tidy}
                className="chaos-file"
                aria-hidden="true"
                style={{
                  '--mx': `${c.at[0]}%`,
                  '--my': `${c.at[1]}%`,
                  '--mr': `${c.at[2]}deg`,
                  '--col': c.col,
                  '--row': c.row,
                  '--i': i,
                }}
              >
                <span className="chaos-messy">
                  <FileChip ext={c.messy.split('.').pop().length <= 4 ? c.messy.split('.').pop().toUpperCase() : 'MSG'} size="xs" />
                  <span className="chaos-name">{c.messy}</span>
                </span>
                <span className="chaos-tidy">
                  <span className="chaos-tidy-title">{c.tidy}</span>
                  <TypeBadge type={c.type} small />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- library */

function Library({ url }) {
  const [subject, setSubject] = useState('math');
  const [type, setType] = useState('All');
  const [openMaterial, setOpenMaterial] = useState(null);
  const s = SUBJECT[subject];
  const inSubject = MATERIALS.filter((m) => m.subject === subject);
  const shown = inSubject.filter((m) => type === 'All' || m.type === type);

  return (
    <section id="library" className="section library" aria-labelledby="library-title">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow" data-reveal>
            Browse by subject
          </p>
          <h2 id="library-title" className="section-title" data-reveal>
            Every subject gets its own folder.
          </h2>
          <p className="lede" data-reveal>
            Pick a folder, filter by what kind of material you want, and the best-rated rises to the top. Try it —
            these are real entries from the library&rsquo;s sample set.
          </p>
        </div>

        <div className="library-grid">
          <div className="folders" role="listbox" aria-label="Subjects" data-reveal>
            {SUBJECTS.map((f, i) => (
              <button
                key={f.id}
                type="button"
                role="option"
                aria-selected={subject === f.id}
                className={`folder hue ${subject === f.id ? 'is-on' : ''}`}
                style={{ ...hueStyle(f), '--angle': `${[90, 45, 0, 135][i % 4]}deg`, '--gap': `${[5, 7, 4, 8, 9, 6, 5, 7][i]}px` }}
                onClick={() => setSubject(f.id)}
                onPointerMove={spotlight}
              >
                <span className="folder-tab" />
                <span className="folder-hatch" />
                <span className="folder-icon">
                  <Icon name="folder" size={16} />
                </span>
                <span className="folder-name">{f.name}</span>
                <span className="folder-topics">{f.topics}</span>
              </button>
            ))}
          </div>

          <div className="panel hue" style={hueStyle(s)} data-reveal>
            <div className="panel-head">
              <div>
                <span className="panel-kicker">
                  <Icon name="folder" size={14} /> Folder
                </span>
                <h3 className="panel-title" key={subject}>
                  {s.name}
                </h3>
              </div>
              <a className="text-link" href={url(`/subject/${s.id}`)}>
                Open folder <Icon name="arrow" size={14} />
              </a>
            </div>

            <div className="chips" role="group" aria-label="Filter by type">
              {['All', ...TYPES].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`chip ${type === t ? 'is-on' : ''}`}
                  aria-pressed={type === t}
                  onClick={() => setType(t)}
                >
                  {t}
                  <span className="chip-count">
                    {t === 'All' ? inSubject.length : inSubject.filter((m) => m.type === t).length}
                  </span>
                </button>
              ))}
            </div>

            <ul className="rows" key={`${subject}-${type}`}>
              {shown.map((m, i) => (
                <li key={m.id} style={{ '--i': i }}>
                  <button type="button" className="row" onClick={() => setOpenMaterial(m)}>
                    <FileChip ext={m.ext} size="sm" />
                    <span className="row-text">
                      <span className="row-title">{m.title}</span>
                      <span className="row-meta">
                        {m.level} · {m.pages} pages · <Icon name="download" size={12} /> {fmt(m.downloads)}
                      </span>
                    </span>
                    <TypeBadge type={m.type} small />
                    <Icon name="arrow" size={15} className="row-go" />
                  </button>
                </li>
              ))}
              {shown.length === 0 && (
                <li className="empty" style={{ '--i': 0 }}>
                  <span className="empty-icon">
                    <Icon name="upload" size={18} />
                  </span>
                  <span>
                    <strong>No {type.toLowerCase()} in {s.name} yet.</strong>
                    <br />
                    That&rsquo;s the gap the next upload fills — maybe yours.
                  </span>
                  <a className="text-link" href={url('/upload')}>
                    Upload <Icon name="arrow" size={14} />
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {openMaterial && <MaterialModal material={openMaterial} onClose={() => setOpenMaterial(null)} url={url} />}
    </section>
  );
}

function MaterialModal({ material: m, onClose, url }) {
  const closeRef = useRef(null);
  const titleId = useId();
  const [leaving, setLeaving] = useState(false);
  const reduced = useReducedMotion();

  const close = useCallback(() => {
    if (reduced) onClose();
    else setLeaving(true);
  }, [onClose, reduced]);

  useEffect(() => {
    const prev = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [close]);

  // Keep Tab inside the dialog.
  const trap = (e) => {
    if (e.key !== 'Tab') return;
    const f = e.currentTarget.querySelectorAll('a[href], button:not([disabled])');
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const s = SUBJECT[m.subject];
  return (
    <div
      className={`modal-backdrop ${leaving ? 'is-leaving' : ''}`}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
      onAnimationEnd={(e) => leaving && e.target === e.currentTarget && onClose()}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={trap}>
        <div className="modal-cover hue" style={hueStyle(s)}>
          <span className="folder-hatch" />
          <FileChip ext={m.ext} size="lg" />
          <button ref={closeRef} type="button" className="icon-btn modal-close" onClick={close} aria-label="Close">
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-tags">
            <span className="badge hue" style={hueStyle(s)}>
              {s.name}
            </span>
            <TypeBadge type={m.type} />
            <span className="badge badge--plain">{m.level}</span>
          </div>
          <h3 id={titleId} className="modal-title">
            {m.title}
          </h3>
          <p className="modal-desc">{m.description}</p>
          <dl className="modal-facts">
            <div>
              <dt>Pages</dt>
              <dd>{m.pages}</dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>{m.ext}</dd>
            </div>
            <div>
              <dt>Downloads</dt>
              <dd>{fmt(m.downloads)}</dd>
            </div>
          </dl>
          <div className="modal-actions">
            <MagneticButton href={url('/')} size="md">
              <Icon name="open" size={15} strokeWidth={1.6} /> Open in the library
            </MagneticButton>
            <p className="modal-note">A classmate&rsquo;s work — useful, and worth checking against your own.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ resources */

const RESOURCES = [
  {
    type: 'Notes',
    icon: 'doc',
    headline: 'Full notes, rewritten by someone who sat the course.',
    body: 'Term-long notes with worked examples, organised the way the syllabus runs — the ones you wish you’d taken.',
    points: ['Worked examples for every rule', 'PDF, DOCX, slides or photos', 'Follows your syllabus order'],
  },
  {
    type: 'Summary',
    icon: 'list',
    headline: 'The whole topic, on a page you can pin above your desk.',
    body: 'Condensed, exam-week revision: one page per idea, the arrows redrawn cleanly, nothing you don’t need.',
    points: ['One page per concept', 'Made for the week before', 'Perfect for last-minute review'],
  },
  {
    type: 'Flashcards',
    icon: 'cards',
    headline: 'Decks that were printed, cut, and actually used.',
    body: 'Two-sided cards, sorted by topic so you can revise one section at a time. Try the deck on the right.',
    points: ['Sorted by topic', 'Print double-sided and cut', 'Terms, formulae, definitions'],
  },
  {
    type: 'Practice Questions',
    icon: 'question',
    headline: 'Routine to hard, with the workings at the back.',
    body: 'Problem sets and drill sheets with full solutions — so you find the gap before the exam does.',
    points: ['Answers with full workings', 'Arranged by difficulty', 'Common mistakes flagged'],
  },
];

function Resources() {
  const [tab, setTab] = useState(0);
  const tabsRef = useRef([]);
  const base = useId();
  const r = RESOURCES[tab];

  const onKeyDown = (e) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (tab + dir + RESOURCES.length) % RESOURCES.length;
    setTab(next);
    tabsRef.current[next]?.focus();
  };

  return (
    <section id="resources" className="section resources" aria-labelledby="resources-title">
      <div className="container">
        <div className="section-head section-head--center">
          <p className="eyebrow" data-reveal>
            Four kinds of material
          </p>
          <h2 id="resources-title" className="section-title" data-reveal>
            However you revise, someone&rsquo;s made it.
          </h2>
        </div>

        <div className="tabs" role="tablist" aria-label="Resource types" onKeyDown={onKeyDown} data-reveal>
          {RESOURCES.map((res, i) => (
            <button
              key={res.type}
              ref={(el) => (tabsRef.current[i] = el)}
              role="tab"
              id={`${base}-tab-${i}`}
              aria-selected={tab === i}
              aria-controls={`${base}-panel`}
              tabIndex={tab === i ? 0 : -1}
              className={`tab hue ${tab === i ? 'is-on' : ''}`}
              style={hueStyle(TYPE_HUE[res.type])}
              onClick={() => setTab(i)}
            >
              <span className="tab-icon">
                <Icon name={res.icon} size={16} />
              </span>
              {res.type}
            </button>
          ))}
        </div>

        <div
          className="resource hue"
          style={hueStyle(TYPE_HUE[r.type])}
          role="tabpanel"
          id={`${base}-panel`}
          aria-labelledby={`${base}-tab-${tab}`}
          data-reveal
        >
          <div className="resource-copy" key={`copy-${tab}`}>
            <TypeBadge type={r.type} />
            <h3 className="resource-title">{r.headline}</h3>
            <p className="resource-body">{r.body}</p>
            <ul className="ticks">
              {r.points.map((p) => (
                <li key={p}>
                  <Icon name="check" size={14} strokeWidth={2} /> {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="resource-preview" key={`prev-${tab}`}>
            {tab === 0 && <NotesPreview />}
            {tab === 1 && <SummaryPreview />}
            {tab === 2 && <FlashcardsPreview />}
            {tab === 3 && <PracticePreview />}
          </div>
        </div>
      </div>
    </section>
  );
}

function NotesPreview() {
  return (
    <div className="paper paper--notes">
      <div className="paper-head">
        <span>Calculus I</span>
        <span>p. 7 / 42</span>
      </div>
      <h4>2.3 The derivative as a limit</h4>
      <p className="ink-line" style={{ '--w': '92%', '--i': 0 }}>
        The derivative measures how fast <i>f</i> changes at a single point.
      </p>
      <div className="formula ink-line" style={{ '--w': '70%', '--i': 1 }}>
        f′(x) = lim<sub>h→0</sub> [ f(x + h) − f(x) ] / h
      </div>
      <p className="ink-line" style={{ '--w': '84%', '--i': 2 }}>
        <b>Worked example.</b> For f(x) = x², the quotient is 2x + h, so f′(x) = 2x.
      </p>
      <span className="scribble" style={{ '--i': 3 }}>
        ← on every paper!
      </span>
      <div className="ruled" />
    </div>
  );
}

function SummaryPreview() {
  const rows = [
    ['Substitution', 'Nucleophile replaces a leaving group', 'SN1 · SN2'],
    ['Elimination', 'Lose H–X, form a C=C double bond', 'E1 · E2'],
    ['Addition', 'Break a π bond, add across it', 'Electrophilic'],
    ['Rearrangement', 'Carbocation shifts to be more stable', '1,2-shift'],
  ];
  return (
    <div className="paper paper--summary">
      <div className="paper-head">
        <span>Organic Chemistry — Mechanisms</span>
        <span>1 page</span>
      </div>
      {rows.map(([name, what, tag], i) => (
        <div className="sum-row" key={name} style={{ '--i': i }}>
          <span className="sum-name">{name}</span>
          <span className="sum-what">{what}</span>
          <span className="sum-tag">{tag}</span>
        </div>
      ))}
      <p className="sum-foot">
        <mark>Exam tip:</mark> tertiary carbocations favour SN1 and E1.
      </p>
    </div>
  );
}

function FlashcardsPreview() {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = FLASHCARDS[i];
  const go = (d) => {
    setFlipped(false);
    setI((n) => (n + d + FLASHCARDS.length) % FLASHCARDS.length);
  };
  return (
    <div className="deck">
      <div className="deck-stack">
        <span className="deck-shadow deck-shadow--2" />
        <span className="deck-shadow deck-shadow--1" />
        <button
          type="button"
          className={`flashcard ${flipped ? 'is-flipped' : ''}`}
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? `Answer: ${card.a}. Click to see the question.` : `Question: ${card.q}. Click to reveal the answer.`}
          key={i}
        >
          <span className="flashcard-face flashcard-front">
            <span className="flashcard-kicker">Question</span>
            <span className="flashcard-text">{card.q}</span>
            <span className="flashcard-hint">Click to flip</span>
          </span>
          <span className="flashcard-face flashcard-back">
            <span className="flashcard-kicker">Answer</span>
            <span className="flashcard-text">{card.a}</span>
            <span className="flashcard-hint">Mitosis &amp; Meiosis · Form 4</span>
          </span>
        </button>
      </div>
      <div className="deck-controls">
        <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label="Previous card">
          <Icon name="arrow" size={16} className="flip-x" />
        </button>
        <span className="deck-count" aria-live="polite">
          {i + 1} / {FLASHCARDS.length}
        </span>
        <button type="button" className="icon-btn" onClick={() => go(1)} aria-label="Next card">
          <Icon name="arrow" size={16} />
        </button>
      </div>
    </div>
  );
}

function PracticePreview() {
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState(null);
  const q = QUESTIONS[qi];
  const answered = picked !== null;
  return (
    <div className="paper paper--quiz">
      <div className="paper-head">
        <span>Mechanics — Problem Set</span>
        <span>
          Q{qi + 1} of {QUESTIONS.length}
        </span>
      </div>
      <p className="quiz-q" key={qi}>
        {q.q}
      </p>
      <div className="quiz-options" role="group" aria-label="Answers">
        {q.options.map((o, i) => {
          const state = !answered ? '' : i === q.answer ? 'is-right' : i === picked ? 'is-wrong' : 'is-dim';
          return (
            <button key={o} type="button" className={`quiz-opt ${state}`} disabled={answered} onClick={() => setPicked(i)}>
              <span className="quiz-letter">{'ABCD'[i]}</span>
              {o}
              {answered && i === q.answer && <Icon name="check" size={15} strokeWidth={2.2} className="quiz-mark" />}
            </button>
          );
        })}
      </div>
      <div className={`quiz-working ${answered ? 'is-open' : ''}`} aria-live="polite">
        <div>
          {answered && (
            <>
              <strong>{picked === q.answer ? 'Correct.' : 'Not quite.'}</strong> {q.working}
            </>
          )}
        </div>
      </div>
      <button
        type="button"
        className="text-link quiz-next"
        onClick={() => {
          setPicked(null);
          setQi((n) => (n + 1) % QUESTIONS.length);
        }}
      >
        {answered ? 'Next question' : 'Skip'} <Icon name="arrow" size={14} />
      </button>
    </div>
  );
}

/* --------------------------------------------------------- how it works */

const STEPS = [
  { title: 'Find a subject', body: 'Eight folders to start — Mathematics to Geography — and students can add more.', visual: 'find' },
  { title: 'Pick a resource type', body: 'Notes, summaries, flashcards or practice questions, filtered by level. Best-rated first.', visual: 'pick' },
  { title: 'Learn', body: 'Read it in the browser, download it, star it for later. Ask the author a question in Discuss.', visual: 'learn' },
  { title: 'Pass it on', body: 'Upload what you made. Next year’s class will find it the same way you did.', visual: 'share' },
];
const STEP_MS = 4200;

function HowItWorks({ reduced }) {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ref, inView] = useInView({ threshold: 0.35, once: false });
  const running = inView && !paused && !reduced;

  return (
    <section id="how" className="section how" aria-labelledby="how-title">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow" data-reveal>
            How it works
          </p>
          <h2 id="how-title" className="section-title" data-reveal>
            From &ldquo;I&rsquo;m lost&rdquo; to revising in about a minute.
          </h2>
        </div>

        <div
          ref={ref}
          className="how-grid"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <ol className="steps" data-reveal>
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <button
                  type="button"
                  className={`step ${step === i ? 'is-on' : ''} ${i < step ? 'is-done' : ''}`}
                  aria-current={step === i ? 'step' : undefined}
                  onClick={() => setStep(i)}
                >
                  <span className="step-num">{i + 1}</span>
                  <span className="step-text">
                    <span className="step-title">{s.title}</span>
                    <span className="step-body">{s.body}</span>
                  </span>
                  {step === i && (
                    <span className="step-bar" aria-hidden="true">
                      <span
                        key={step}
                        style={{ animationDuration: `${STEP_MS}ms`, animationPlayState: running ? 'running' : 'paused' }}
                        onAnimationEnd={() => setStep((n) => (n + 1) % STEPS.length)}
                      />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ol>

          <div className="how-screen" aria-hidden="true" data-reveal>
            <div className="how-screen-bar">
              <span className="mock-dots">
                <i />
                <i />
                <i />
              </span>
              <span className="how-crumb">
                Library {step >= 1 && <>/ Biology</>} {step === 2 && <>/ Flashcards</>}
                {step === 3 && <>/ New upload</>}
              </span>
            </div>
            <div className="how-stage">
              <HowVisual kind="find" on={step === 0} />
              <HowVisual kind="pick" on={step === 1} />
              <HowVisual kind="learn" on={step === 2} />
              <HowVisual kind="share" on={step === 3} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowVisual({ kind, on }) {
  const cls = `how-visual how-visual--${kind} ${on ? 'is-on' : ''}`;
  if (kind === 'find') {
    return (
      <div className={cls}>
        <div className="mini-search">
          <Icon name="search" size={13} />
          <span className="typing">biology</span>
        </div>
        <div className="mini-folders">
          {SUBJECTS.map((s) => (
            <span key={s.id} className={`mini-folder hue ${s.id === 'bio' ? 'is-hit' : ''}`} style={hueStyle(s)}>
              <Icon name="folder" size={13} />
              {s.name}
            </span>
          ))}
        </div>
        <span className="cursor" />
      </div>
    );
  }
  if (kind === 'pick') {
    const bio = MATERIALS.filter((m) => m.subject === 'bio');
    return (
      <div className={cls}>
        <div className="mini-chips">
          {TYPES.map((t) => (
            <span key={t} className={`mini-chip ${t === 'Flashcards' ? 'is-on' : ''}`}>
              {t}
            </span>
          ))}
        </div>
        {bio.map((m) => (
          <div key={m.id} className={`mini-row ${m.type === 'Flashcards' ? 'is-hit' : 'is-out'}`}>
            <FileChip ext={m.ext} size="xs" />
            <span>{m.title}</span>
            <TypeBadge type={m.type} small />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'learn') {
    return (
      <div className={cls}>
        <div className="mini-detail">
          <FileChip ext="PDF" size="lg" />
          <div>
            <span className="mini-detail-title">Cell Biology — Mitosis and Meiosis Flashcards</span>
            <span className="mini-detail-meta">96 pages · Form 4 · 812 downloads</span>
            <div className="mini-actions">
              <span className="mini-btn mini-btn--primary">
                <Icon name="download" size={13} strokeWidth={1.7} /> Download
              </span>
              <span className="mini-btn mini-star">
                <Icon name="star" size={13} /> Saved
              </span>
            </div>
          </div>
        </div>
        <div className="mini-comment">
          <span className="avatar">A</span>
          <span>“Split by topic, then shuffle everything once a week.”</span>
        </div>
      </div>
    );
  }
  return (
    <div className={cls}>
      <div className="drop">
        <span className="drop-file">
          <FileChip ext="PDF" size="sm" />
          Ecology — Food Webs Notes.pdf
        </span>
        <span className="drop-label">
          <Icon name="upload" size={16} /> Drop a PDF, doc, slides or photo
        </span>
      </div>
      <div className="mini-progress">
        <span />
      </div>
      <div className="mini-toast">
        <Icon name="check" size={14} strokeWidth={2.2} /> Published to <strong>&nbsp;Biology</strong>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- features */

const FEATURES = [
  {
    icon: 'folder',
    title: 'Subject folders',
    body: 'Every material lives in one folder, filtered by type and level, with the best-rated at the top.',
    size: 'wide',
    art: 'folders',
  },
  {
    icon: 'heart',
    title: 'Free, for good',
    body: 'No ads, no paywall, no premium tier. Just students passing their work on.',
    art: 'zero',
  },
  {
    icon: 'chat',
    title: 'Discussions',
    body: 'Ask which notes cover the syllabus, request what’s missing, and hear when someone replies.',
  },
  {
    icon: 'doc',
    title: 'Workspace',
    body: 'Write a document or build a slide deck in plain markdown — publish it to the library as a PDF in one step.',
    art: 'md',
  },
  {
    icon: 'shield',
    title: 'Looked after',
    body: 'Anything reported by a few different people comes down for a student moderator to review.',
  },
  {
    icon: 'star',
    title: 'The good stuff rises',
    body: 'Stars and downloads push the most useful material to the top of every folder.',
    size: 'wide',
    art: 'votes',
  },
];

function Features() {
  return (
    <section id="features" className="section features" aria-labelledby="features-title">
      <div className="container">
        <div className="section-head section-head--center">
          <p className="eyebrow" data-reveal>
            What&rsquo;s inside
          </p>
          <h2 id="features-title" className="section-title" data-reveal>
            A library, a study room, and a noticeboard.
          </h2>
        </div>
        <div className="bento">
          {FEATURES.map((f, i) => (
            <article
              key={f.title}
              className={`card spot ${f.size === 'wide' ? 'card--wide' : ''}`}
              onPointerMove={spotlight}
              data-reveal
              style={{ '--d': `${(i % 3) * 90}ms` }}
            >
              <span className="card-icon">
                <Icon name={f.icon} size={18} />
              </span>
              <h3 className="card-title">{f.title}</h3>
              <p className="card-body">{f.body}</p>
              {f.art && <FeatureArt kind={f.art} />}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureArt({ kind }) {
  if (kind === 'folders') {
    return (
      <div className="art art--folders" aria-hidden="true">
        {SUBJECTS.slice(0, 5).map((s, i) => (
          <span key={s.id} className="art-folder hue" style={{ ...hueStyle(s), '--i': i }}>
            <Icon name="folder" size={13} /> {s.name}
          </span>
        ))}
      </div>
    );
  }
  if (kind === 'zero') {
    return (
      <div className="art art--zero" aria-hidden="true">
        <span>$0</span>
      </div>
    );
  }
  if (kind === 'md') {
    return (
      <div className="art art--md" aria-hidden="true">
        <code># Genetics</code>
        <code>- Punnett squares</code>
        <span className="art-md-arrow">
          <Icon name="arrow" size={14} />
        </span>
        <FileChip ext="PDF" size="sm" />
      </div>
    );
  }
  return (
    <div className="art art--votes" aria-hidden="true">
      {MATERIALS.slice(0, 3).map((m, i) => (
        <span key={m.id} className="vote-row" style={{ '--i': i }}>
          <span className="vote-rank">{i + 1}</span>
          <span className="vote-title">{m.title.split(' — ')[0]}</span>
          <span className="vote-count">
            <Icon name="star" size={12} /> {fmt(Math.round(m.downloads / 9))}
          </span>
        </span>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- stats */

function Stats({ liveStats }) {
  const [ref, inView] = useInView({ threshold: 0.4 });
  const items = [
    ...(liveStats?.materials ? [{ value: liveStats.materials, label: 'materials shared' }] : []),
    { value: SUBJECTS.length, label: 'subject folders to start' },
    { value: TYPES.length, label: 'kinds of material' },
    { value: 0, from: 49, prefix: '$', label: 'to use — ever' },
    { value: 100, suffix: '%', label: 'written by students' },
    ...(liveStats?.students ? [{ value: liveStats.students, label: 'students signed up' }] : []),
  ].slice(0, 5);

  return (
    <section className="stats" aria-label="By the numbers" ref={ref}>
      <div className="stats-bg" aria-hidden="true" />
      <div className="container stats-grid" style={{ '--n': items.length }}>
        {items.map((s, i) => (
          <Counter key={s.label} {...s} active={inView} delay={i * 120} />
        ))}
      </div>
    </section>
  );
}

function Counter({ value, from = 0, prefix = '', suffix = '', label, active, delay }) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    if (!active) return undefined;
    const t = setTimeout(() => setGo(true), delay);
    return () => clearTimeout(t);
  }, [active, delay]);
  const n = useCountUp(value, go, { from });
  return (
    <div className={`stat ${go ? 'is-in' : ''}`}>
      <span className="stat-value" aria-hidden="true">
        {prefix}
        {fmt(n)}
        {suffix}
      </span>
      <span className="sr-only">
        {prefix}
        {fmt(value)}
        {suffix}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------ community */

function Community({ url }) {
  const [openRule, setOpenRule] = useState(0);
  return (
    <section id="community" className="section community" aria-labelledby="community-title">
      <div className="container community-grid">
        <div>
          <p className="eyebrow" data-reveal>
            Community
          </p>
          <h2 id="community-title" className="section-title" data-reveal>
            Built by students. Looked after by students.
          </h2>
          <p className="lede" data-reveal>
            Nothing is graded and nothing is official. It&rsquo;s a classmate&rsquo;s work — useful, and worth
            checking against your own. When something&rsquo;s missing, ask; someone usually has it.
          </p>

          <div className="threads">
            {THREADS.map((t, i) => (
              <a
                key={t.title}
                href={url('/discuss')}
                className="thread spot"
                onPointerMove={spotlight}
                data-reveal
                style={{ '--d': `${i * 110}ms` }}
              >
                <span className="thread-top">
                  <span className="badge badge--sm hue" style={hueStyle(TAG_HUE[t.tag])}>
                    {t.tag}
                  </span>
                  <span className="thread-ago">{t.ago}</span>
                </span>
                <span className="thread-title">{t.title}</span>
                <span className="thread-reply">
                  <span className="avatar avatar--sm">
                    <Icon name="chat" size={11} />
                  </span>
                  {t.reply}
                </span>
                <span className="thread-count">
                  {t.replies} {t.replies === 1 ? 'reply' : 'replies'}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="rules" data-reveal>
          <div className="rules-head">
            <span className="card-icon">
              <Icon name="shield" size={18} />
            </span>
            <div>
              <h3 className="rules-title">Five short guidelines</h3>
              <p className="rules-sub">Short, and enforced. Three separate reports take a file down for review.</p>
            </div>
          </div>
          <ol className="rule-list">
            {GUIDELINES.map((g, i) => {
              const open = openRule === i;
              return (
                <li key={g.title} className={`rule ${open ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="rule-btn"
                    aria-expanded={open}
                    onClick={() => setOpenRule(open ? -1 : i)}
                  >
                    <span className="rule-num">{i + 1}</span>
                    <span className="rule-title">{g.title}</span>
                    <span className="rule-plus" aria-hidden="true" />
                  </button>
                  <div className="rule-body">
                    <p>{g.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ final cta */

function FinalCta({ url }) {
  return (
    <section id="join" className="cta" aria-labelledby="cta-title">
      <div className="cta-bg" aria-hidden="true">
        <span className="orb orb--1" />
        <span className="orb orb--2" />
        <span className="grain" />
        {['PDF', 'DOCX', 'PPTX', 'PDF', 'JPG', 'PDF'].map((e, i) => (
          <span key={i} className={`cta-chip cta-chip--${i}`}>
            <FileChip ext={e} size="sm" />
          </span>
        ))}
      </div>
      <div className="container cta-inner">
        <h2 id="cta-title" className="cta-title" data-reveal>
          Ready when you are.
        </h2>
        <p className="cta-sub" data-reveal>
          Sign in with your school email or Google. It takes a few seconds, and it&rsquo;s the only thing between you
          and the library.
        </p>
        <div className="cta-cards">
          <a className="cta-card spot" href={url('/')} onPointerMove={spotlight} data-reveal>
            <span className="cta-card-icon">
              <Icon name="search" size={20} />
            </span>
            <span className="cta-card-title">I need notes</span>
            <span className="cta-card-body">Browse every subject folder, free.</span>
            <span className="cta-card-go">
              Browse the library <Icon name="arrow" size={15} />
            </span>
          </a>
          <a
            className="cta-card spot"
            href={url('/upload')}
            onPointerMove={spotlight}
            data-reveal
            style={{ '--d': '120ms' }}
          >
            <span className="cta-card-icon">
              <Icon name="upload" size={20} />
            </span>
            <span className="cta-card-title">I have notes</span>
            <span className="cta-card-body">Upload what you made. Help next year&rsquo;s class.</span>
            <span className="cta-card-go">
              Share your notes <Icon name="arrow" size={15} />
            </span>
          </a>
        </div>
        <a className="cta-guidelines" href={url('/about#guidelines')} data-reveal>
          Read the guidelines first
        </a>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- footer */

function Footer({ url }) {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a className="brand" href="#top">
            <Mark size={28} />
            <span className="brand-name">UGA Open Source</span>
          </a>
          <p className="footer-tag">Study notes, shared by the students who wrote them.</p>
          <a className="social" href={INSTAGRAM} target="_blank" rel="noopener noreferrer">
            <Icon name="instagram" size={16} /> @ugaopensource
          </a>
        </div>
        <nav className="footer-col" aria-label="Library">
          <h3>Library</h3>
          <a href={url('/')}>Browse subjects</a>
          <a href={url('/discuss')}>Discussions</a>
          <a href={url('/workspace')}>Workspace</a>
          <a href={url('/upload')}>Upload</a>
        </nav>
        <nav className="footer-col" aria-label="About">
          <h3>About</h3>
          <a href={url('/about')}>About the site</a>
          <a href={url('/about#guidelines')}>Upload guidelines</a>
          <a href={url('/updates')}>Updates</a>
        </nav>
        <nav className="footer-col" aria-label="On this page">
          <h3>On this page</h3>
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`}>
              {n.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="container footer-foot">
        <span>Student-run, free, and not an official school platform.</span>
        <a href="#top" className="to-top">
          Back to top <Icon name="arrow" size={14} className="rot-up" />
        </a>
      </div>
    </footer>
  );
}
