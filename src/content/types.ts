/**
 * Types shared between the editable JSON content (content.json), the site
 * code and the /admin editor.
 */

export type Vec3 = [number, number, number];

/** RGB triplet, 0–255. Used by the procedural galaxy painter. */
export type RGB = [number, number, number];

export type GalaxyLook = {
  seed: number;
  /** Number of spiral arms. */
  arms: number;
  /** Spiral winding factor — higher = more tightly wound arms. */
  tightness: number;
  /** Vertical squash of the disc, 1 = face-on, 0.5 = strongly inclined. */
  inclination: number;
  /** Position angle of the disc on the sky, radians. */
  positionAngle: number;
  /** Bright centre colour (cream / gold). */
  core: RGB;
  /** Mid-disc colour (the dominant hue of the galaxy). */
  arm: RGB;
  /** Deep outskirt colour (dark navy / violet rim masses). */
  rim: RGB;
  /** Accent colour for glowing knots and sparkles. */
  knot: RGB;
  /** Fraction of painted sources that become bright HII-like knots. */
  knotFraction: number;
};

export type IdentityContent = {
  name: string;
  fullName: string;
  role: string;
  headline: string;
  intro: string;
  email: string;
  github: string;
  cvHref: string;
  siteUrl: string;
};

export type MilestoneContent = {
  id: string;
  title: string;
  shortTitle: string;
  /** ISO start date — drives the poetic redshift chip. */
  date: string;
  /** Human-readable date or date range shown in the UI. */
  dateLabel: string;
  description: string;
  /** Optional link; empty string means "no link". */
  href: string;
};

export type PaperContent = {
  id: string;
  title: string;
  authors: string;
  venue: string;
  year: number;
  abstract: string;
  links: { label: string; href: string }[];
  featured: boolean;
};

export type PosterContent = {
  id: string;
  title: string;
  event: string;
  year: number;
  href: string;
};

export type SlideContent = {
  id: string;
  title: string;
  event: string;
  date: string;
  href: string;
};

export type ReportContent = {
  id: string;
  title: string;
  context: string;
  year: number;
  description: string;
  href: string;
};

export type AboutContent = {
  position: string;
  bio: string[];
  interests: string[];
  skills: string[];
};

export type ExternalLinkContent = {
  id: string;
  label: string;
  href: string;
  description: string;
};

export type SiteContent = {
  identity: IdentityContent;
  milestones: MilestoneContent[];
  papers: PaperContent[];
  posters: PosterContent[];
  slides: SlideContent[];
  reports: ReportContent[];
  about: AboutContent;
  externalLinks: ExternalLinkContent[];
};
