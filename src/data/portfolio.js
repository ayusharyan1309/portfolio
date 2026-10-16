// All page content lives here. Every experience line and project is tagged with
// a track — 'backend', 'ai' or 'product' — which drives the amber / lilac
// colour coding across the site. Keep this in sync with the resume, LinkedIn
// and Naukri: recruiters cross-check profiles.

export const SITE_URL = 'https://ayush-aryan1309-portfolio.vercel.app/'

export const tracks = {
  backend: { label: 'Java & backend' },
  ai: { label: 'AI & GenAI' },
  product: { label: 'Product & mobile' },
}

export const personalInfo = {
  name: 'Ayush Aryan',
  role: 'Java backend & GenAI engineer',
  currentRole: 'Software Engineer (SDE-1) at Visionify',
  intro:
    'I build event-driven services in Java, Spring Boot and Kafka for platforms with 100K+ concurrent users, and I ship the LLM and RAG features that run on top of them.',
  lookingFor: 'Open to Java backend and GenAI engineering roles.',
  // First full-time role; the hero computes years of experience from this.
  fullTimeSince: '2025-02',
  email: 'ayusharyan1309@gmail.com',
  phone: '+91 8340646275',
  location: 'Hyderabad, India',
  resumeLink: 'https://drive.google.com/file/d/1Q8hGu1eM2ooj7_VvSbKbA9jwKE7DPm3h/view?usp=sharing',
  siteUrl: SITE_URL,
  socialLinks: [
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/ayusharyan1309/', icon: 'linkedin' },
    { name: 'GitHub', url: 'https://github.com/ayusharyan1309', icon: 'github' },
    { name: 'LeetCode', url: 'https://leetcode.com/u/ayusharyan1309/', icon: 'leetcode' },
  ],

  proof: [
    { value: '100K+', text: 'concurrent users on the event-CRM backend I architected at EventStrat' },
    { value: '10K+', text: 'safety events a day through the alerting service I own at Visionify' },
    { value: '<150 ms', text: 'end-to-end API response time held through peak bursts' },
    { value: '4', text: 'apps shipped to production, two of them on the App Store' },
  ],

  experience: [
    {
      company: 'Visionify Inc.',
      url: 'https://www.visionify.ai/',
      role: 'Software Engineer (SDE-1)',
      period: 'Sep 2025 – Present',
      stack: 'Java, Spring Boot, Kafka, Redis, Computer Vision, GenAI, Electron',
      highlights: [
        {
          track: 'backend',
          text: 'Own the event-driven alerting service that sends real-time workplace-safety notifications over Email, Microsoft Teams and WhatsApp — <strong>10K+ events/day</strong> with end-to-end API responses <strong>under 150 ms</strong> and fault-tolerant routing through peak bursts.',
        },
        {
          track: 'ai',
          text: 'Building <strong>PalletVision</strong> end to end — the CV detection model, backend services and frontend — tracking pallet builds and dismantles in real time for productivity, grading and dimensional analytics.',
        },
        {
          track: 'ai',
          text: 'Built <strong>ErgoVision</strong>, a mobile computer-vision app that analyses worker posture in real time and gives <strong>GenAI-personalised</strong> ergonomic recommendations.',
        },
        {
          track: 'product',
          text: 'Deployed a cross-platform Electron app on edge devices that surfaces live system health and camera telemetry, speeding up incident detection.',
        },
      ],
    },
    {
      company: 'EventStrat',
      url: 'https://eventstrat.ai/',
      role: 'Software Engineer (SDE-1)',
      period: 'Feb 2025 – Aug 2025',
      stack: 'Java, Spring Boot, Microservices, Kafka, Redis, Elasticsearch',
      highlights: [
        {
          track: 'backend',
          text: 'Architected backend microservices for a global event-CRM platform supporting <strong>100K+ concurrent users</strong> across international events.',
        },
        {
          track: 'backend',
          text: 'Built a fault-tolerant bulk ingestion pipeline — <strong>50K+ rows per file, 2K+ files per batch</strong> — with schema validation and automatic retries.',
        },
        {
          track: 'backend',
          text: 'Built exhibitor payment workflows with multi-installment plans, event-specific tax calculation and automated reminders.',
        },
        {
          track: 'backend',
          text: 'Enabled real-time notifications and attendee tracking on a distributed, event-driven architecture using <strong>Kafka and Redis</strong>.',
        },
      ],
    },
    {
      company: 'Sneaco.in',
      url: null,
      role: 'Software Developer Intern',
      period: 'Feb 2024 – Jul 2024',
      stack: 'Flutter, REST APIs, Caching, Payments, Auth',
      highlights: [
        {
          track: 'backend',
          text: 'Cut backend request latency by <strong>30%</strong> with in-memory caching and REST endpoint optimisation.',
        },
        {
          track: 'backend',
          text: 'Integrated payment gateways, built auth services for secure onboarding, and designed order scheduling for pickup and delivery logistics.',
        },
        {
          track: 'product',
          text: 'Built and shipped a Flutter app single-handedly, with location-aware service discovery within a 5 km radius.',
        },
      ],
    },
    {
      company: 'Zolatte',
      url: 'https://zolatte.com/',
      role: 'Flutter Developer',
      period: 'Apr 2023 – Aug 2023',
      stack: 'Flutter, OpenAI API',
      highlights: [
        {
          track: 'ai',
          text: 'Built <strong>CHATGURU</strong>, one of the first Hindi-language AI apps, on the OpenAI API — from concept to App Store and Play Store launch.',
        },
        {
          track: 'product',
          text: 'Owned the full product lifecycle, including an offline-first architecture with local storage so the app worked without connectivity.',
        },
      ],
    },
  ],

  // Ordered by relevance to Java backend + GenAI roles. `featured` projects
  // show their full description.
  projects: [
    {
      title: 'RAG assistant for this portfolio',
      tracks: ['ai', 'backend'],
      featured: true,
      description:
        'The chat assistant on this site. Resume and project documents are chunked and embedded with bge-small on Cloudflare Workers AI; each question retrieves the top 5 chunks by cosine similarity and streams an answer from an LLM over SSE. Pluggable provider layer for Groq, OpenAI, Gemini or any OpenAI-compatible endpoint.',
      stack: 'TypeScript, Cloudflare Workers, Workers AI, Groq, Python, React',
      github: 'https://github.com/ayusharyan1309/portfolio',
      tryIt: true,
    },
    {
      title: 'Real-time chat backend',
      tracks: ['backend'],
      featured: true,
      description:
        'Spring Boot 3.5 / Java 17 chat backend: WebSocket (STOMP over SockJS) messaging, Kafka-driven events, Firebase auth, MySQL with Liquibase migrations and S3 media. REST + WebSocket APIs for typing indicators, conversations, blocking and paginated history.',
      stack: 'Java, Spring Boot, WebSocket, Kafka, MySQL, Liquibase, AWS S3',
      github: 'https://github.com/ayusharyan1309/chat-app-backend',
    },
    {
      title: 'LTXGO ride operations platform',
      tracks: ['backend'],
      featured: true,
      description:
        'Booking, dispatch and multi-vehicle ride orchestration on Spring Boot, MySQL, JPA/Hibernate and Liquibase. Real-time tracking and notifications through WebSocket, Firebase FCM and Redis-backed async workflows, with Flutter and React clients.',
      stack: 'Java, Spring Boot, MySQL, Redis, WebSocket, Firebase',
      github: null,
    },
    {
      title: 'Wellness platform backend',
      tracks: ['backend'],
      description:
        'Appointment booking with Redis slot management, Kafka notifications, JWT auth, a blog with Cloudinary uploads, Docker, and OpenAPI docs.',
      stack: 'Java, Spring Boot, Redis, Kafka, MySQL, JWT, Docker',
      github: 'https://github.com/ayusharyan1309/wellness-app-backend',
    },
    {
      title: 'Microservices e-commerce',
      tracks: ['backend'],
      description:
        'Product (MongoDB), order and inventory (MySQL) services on Spring Boot 3.3 with DTOs, JPA/Hibernate and Testcontainers integration tests.',
      stack: 'Java, Spring Boot, MongoDB, MySQL, Testcontainers',
      github: 'https://github.com/ayusharyan1309/microservices-based-E-Commerce-app',
    },
    {
      title: 'Review sentiment and recommendations',
      tracks: ['ai'],
      description:
        'TF-IDF + XGBoost sentiment classifier with SMOTE for class imbalance, feeding collaborative-filtering product recommendations behind a Flask UI.',
      stack: 'Python, XGBoost, scikit-learn, NLTK, Flask',
      github: 'https://github.com/ayusharyan1309/Sentiment-Analysis',
    },
    {
      title: 'Rainfall prediction',
      tracks: ['ai'],
      description: 'Rainfall prediction model with data preprocessing, training and a simple interface.',
      stack: 'Python, scikit-learn',
      github: null,
    },
    {
      title: 'Marketplace app',
      tracks: ['product'],
      description: 'Full-stack marketplace with Flutter, Node.js and MongoDB: auth, product management and REST APIs.',
      stack: 'Flutter, Node.js, MongoDB',
      github: 'https://github.com/ayusharyan1309/E-CommerceApp',
    },
    {
      title: 'Covid-19 tracker',
      tracks: ['product'],
      description: 'Flutter app with global and per-country statistics and interactive charts.',
      stack: 'Flutter, REST APIs',
      github: null,
    },
  ],

  skills: [
    {
      group: 'Java & backend',
      track: 'backend',
      items: ['Java', 'Spring Boot', 'Microservices', 'Event-driven architecture', 'REST APIs', 'gRPC', 'WebSockets', 'Hibernate / JPA', 'Spring Cloud Gateway', 'System design'],
    },
    {
      group: 'AI & GenAI',
      track: 'ai',
      items: ['RAG', 'LLM APIs (OpenAI, Groq, Gemini)', 'Embeddings & vector search', 'LangChain4j', 'LangChain', 'Hugging Face', 'PyTorch', 'Computer vision (OpenCV, MediaPipe)', 'NLP'],
    },
    {
      group: 'Data & messaging',
      items: ['Apache Kafka', 'Redis', 'MySQL', 'MongoDB', 'Elasticsearch', 'Firebase', 'Liquibase'],
    },
    {
      group: 'Cloud & DevOps',
      items: ['AWS (EC2, S3)', 'Docker', 'Jenkins CI/CD', 'Prometheus', 'Grafana', 'Cloudflare Workers', 'Vercel'],
    },
    {
      group: 'Languages',
      items: ['Java', 'Python', 'TypeScript / JavaScript', 'SQL', 'Dart', 'C'],
    },
  ],

  education: {
    school: 'BML Munjal University',
    degree: 'B.Tech in Data Science and Artificial Intelligence',
    period: '2021 – 2025',
    coursework: ['Machine learning & deep learning', 'NLP', 'Data structures & algorithms', 'DBMS', 'Operating systems'],
  },
}

// JSON-LD for search engines.
export const seoJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': `${SITE_URL}#person`,
      name: 'Ayush Aryan',
      url: SITE_URL,
      image: `${SITE_URL}og-image.jpg`,
      jobTitle: 'Java Backend & GenAI Engineer',
      description:
        'Java backend and GenAI engineer. Event-driven services in Java, Spring Boot and Kafka for platforms with 100K+ concurrent users, plus production LLM and RAG features.',
      email: 'ayusharyan1309@gmail.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Hyderabad',
        addressRegion: 'Telangana',
        addressCountry: 'India',
      },
      alumniOf: {
        '@type': 'CollegeOrUniversity',
        name: 'BML Munjal University',
        url: 'https://www.bmu.edu.in/',
      },
      worksFor: { '@type': 'Organization', name: 'Visionify Inc.', url: 'https://www.visionify.ai/' },
      knowsAbout: [
        'Java', 'Spring Boot', 'Microservices', 'Apache Kafka', 'Redis', 'gRPC',
        'Distributed Systems', 'System Design', 'Event-Driven Architecture',
        'MySQL', 'MongoDB', 'Elasticsearch', 'AWS', 'Docker',
        'Generative AI', 'RAG (Retrieval-Augmented Generation)', 'Large Language Models',
        'LangChain4j', 'Vector Search', 'Computer Vision',
      ],
      sameAs: [
        'https://www.linkedin.com/in/ayusharyan1309/',
        'https://github.com/ayusharyan1309',
        'https://leetcode.com/u/ayusharyan1309/',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}#website`,
      url: SITE_URL,
      name: 'Ayush Aryan | Java Backend & GenAI Engineer',
      publisher: { '@id': `${SITE_URL}#person` },
      inLanguage: 'en-IN',
    },
    {
      '@type': 'ProfilePage',
      '@id': `${SITE_URL}#profile`,
      url: SITE_URL,
      name: 'Ayush Aryan | Java Backend & GenAI Engineer',
      mainEntity: { '@id': `${SITE_URL}#person` },
    },
  ],
}
