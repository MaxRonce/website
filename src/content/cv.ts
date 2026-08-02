export type CvEntry = {
  period: string;
  title: string;
  organization: string;
  location?: string;
  summary: string;
  details: string[];
  href?: string;
};

export const cvResearch: CvEntry[] = [
  {
    period: 'Mar - Sep 2026',
    title: 'Research intern - galaxy population inference',
    organization: 'CEA Paris-Saclay · CosmoStat',
    summary:
      'Variational inference for data-driven galaxy population priors with differentiable stellar-population synthesis.',
    details: [
      'Develop amortized posteriors for 15 physical galaxy parameters.',
      'Combine DSPS, normalizing flows and reweighted wake-sleep training.',
      'Study scalable population-level inference for next-generation imaging surveys.',
    ],
    href: '/files/Euclid_DSPS.pdf',
  },
  {
    period: '2025 - 2026',
    title: 'Master research project - foundation models',
    organization: 'IAC Deep · University of Tours',
    location: 'Tenerife / Blois',
    summary:
      'Benchmarking foundation models for unsupervised discovery in matched Euclid imaging and DESI spectroscopy.',
    details: [
      'Compare AstroPT, AstroCLIP and AION multimodal representations.',
      'Build scalable anomaly scores with normalizing flows and cross-modal alignment.',
      'Paper accepted at the ICLR 2026 FM4Science workshop.',
    ],
    href: '/files/57_Benchmarking_foundation_mod.pdf',
  },
  {
    period: '2025 · 3 months',
    title: 'AI assessment for the DOC-Rivers project',
    organization: 'OSUC - Observatory of Universe Sciences',
    summary:
      'Remote sensing of dissolved organic carbon in Arctic rivers with scalable machine-learning workflows.',
    details: [
      'Evaluated mixture-of-experts approaches for remote-sensing data.',
      'Parallelized computation on HPC resources and transferred the workflow to domain scientists.',
    ],
  },
  {
    period: '2024 · 4 months',
    title: 'Scientific software engineering intern',
    organization: 'LPP · CNRS / Ecole Polytechnique',
    location: 'Palaiseau',
    summary:
      'Developed PLASMAG, a simulation environment for search-coil magnetic sensors used in space instrumentation.',
    details: [
      'Designed a dependency-driven simulation engine and scientific interface.',
      'Integrated SPICE simulations and sensor-parameter optimization.',
      'Benchmarked the calculation engine and presented the project to researchers.',
    ],
    href: '/files/STAGE_LPP_v2.pdf',
  },
  {
    period: '2023 · 3 months',
    title: 'Instrumentation software intern',
    organization: 'LPC2E · CNRS / ESA / NASA HelioSwarm',
    location: 'Orleans',
    summary:
      'Built an interface to automate space-instrument testing and measurement acquisition.',
    details: [
      'Controlled oscilloscope hardware through an SDK.',
      'Automated measurements, signal processing and analysis.',
    ],
  },
];
export const cvEducation: CvEntry[] = [
  {
    period: '2024 - 2026',
    title: 'MSc Data Science and Artificial Intelligence',
    organization: 'University of Tours',
    location: 'Blois',
    summary:
      'Machine learning, deep learning, statistics, probability, data engineering and advanced data structures.',
    details: [
      'Research track focused on scientific machine learning and astronomical applications.',
      'Student representative for the University of Tours.',
    ],
  },
  {
    period: '2022 - 2024',
    title: 'BSc-level degree in software engineering (BUT)',
    organization: 'University of Orleans · Institute of Technology',
    summary:
      'Software development, project management and an artificial-intelligence specialization.',
    details: ['Elected student representative to the institute board of directors.'],
  },
  {
    period: '2020 - 2022',
    title: 'Computer science and physics studies',
    organization: 'Polytechnique Montreal',
    location: 'Montreal',
    summary:
      'Software engineering, physics, linear algebra, calculus and scientific simulation.',
    details: ['Developed Python and MATLAB simulations and a team Qt application.'],
  },
];

export const cvSkillGroups = [
  {
    title: 'Scientific ML',
    skills: ['JAX', 'PyTorch', 'Normalizing flows', 'Multimodal transformers', 'VQ-VAE'],
  },
  {
    title: 'Research computing',
    skills: ['Python', 'NumPy', 'Pandas', 'HPC', 'Scientific visualization', 'LaTeX'],
  },
  {
    title: 'Engineering',
    skills: ['C / C++', 'React', 'SQL', 'Git', 'Data engineering', 'Scientific software'],
  },
  {
    title: 'Languages',
    skills: ['French - native', 'English - fluent'],
  },
];
