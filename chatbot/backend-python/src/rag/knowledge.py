"""
Knowledge Base — All the information about Ayush Aryan, structured into
searchable chunks for RAG retrieval.

Each chunk has:
- id: Unique identifier
- content: The text to embed and retrieve
- category: Section of the portfolio (about, experience, skills, etc.)
- metadata: Additional context (company name, role, etc.)
- embedding: Pre-computed embedding vector (populated at init)
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class KnowledgeChunk:
    id: str
    content: str
    category: str
    metadata: dict = field(default_factory=dict)
    embedding: Optional[list[float]] = None


def build_knowledge_base() -> list[KnowledgeChunk]:
    """Build the knowledge base from all portfolio data."""
    chunks: list[KnowledgeChunk] = []

    # === About ===
    chunks.append(KnowledgeChunk(
        id="about-overview",
        category="About",
        content=(
            "Ayush Aryan is a high-impact backend engineer who ships fast and builds "
            "scalable event-driven systems for platforms supporting 100K+ concurrent users. "
            "He has 1.5+ years of full-time software engineering experience, a B.Tech from "
            "BML Munjal University, and startup experience. He brings a product builder "
            "mindset — he doesn't just write code, he owns outcomes end-to-end."
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="about-specialization",
        category="About",
        content=(
            "Ayush specializes in Java, Spring Boot, Apache Kafka, Redis, gRPC, Microservices "
            "Architecture, Computer Vision, GenAI/RAG, LLMs, and Distributed Systems. He builds "
            "production systems that move fast and scale hard."
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="about-location",
        category="About",
        content=(
        "Ayush Aryan is based in Hyderabad, Telangana, India. Born on 13 September 2002."
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="about-looking-for",
        category="About",
        content=(
            "Ayush Aryan is looking for founders and engineering leaders who need a cracked "
            "engineer to own backend architecture, ship rapidly, and build infrastructure that "
            "scales. He is open to Software Engineer roles or early-stage founding engineer positions."
        ),
    ))

    # === Why Hire Me ===
    chunks.append(KnowledgeChunk(
        id="why-ships-fast",
        category="Why Hire Me",
        content=(
            "Ayush ships fast — 4 apps shipped to production, from concept to App Store in "
            "under 4 months. He owns production services processing 10K+ safety events per day."
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="why-builds-scalable",
        category="Why Hire Me",
        content=(
            "Ayush builds scalable systems — event-driven microservices for platforms with "
            "100K+ concurrent users, with Kafka and Redis pipelines holding end-to-end API "
            "latency under 150ms at peak."
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="why-owns-outcomes",
        category="Why Hire Me",
        content=(
            "Ayush owns outcomes end-to-end — from architecture to production deployment. "
            "He has worked directly with founders in fast-paced startups, bringing a product "
            "builder mindset."
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="why-fullstack",
        category="Why Hire Me",
        content=(
            "Ayush is full-stack capable — strong backend core (Java, Spring Boot, Kafka, gRPC) "
            "plus GenAI (RAG, LLMs, LangChain4j) and mobile development (Flutter, 2 App Store launches)."
        ),
    ))

    # === Experience ===
    chunks.append(KnowledgeChunk(
        id="exp-visionify",
        category="Experience",
        metadata={"company": "Visionify Inc.", "role": "Software Engineer (SDE-1)", "period": "September 2025 - Present"},
        content=(
            "At Visionify Inc., Ayush owns the event-driven alerting service that delivers real-time "
            "workplace-safety notifications across Email, Microsoft Teams, and WhatsApp — processing "
            "10K+ events per day with end-to-end API response times under 150ms and fault-tolerant "
            "routing through peak bursts. He also built and deployed a cross-platform Electron "
            "application on edge devices surfacing live system health and camera telemetry, "
            "accelerating incident detection and resolution."
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="exp-visionify-palletvision",
        category="Experience",
        metadata={"company": "Visionify Inc.", "project": "PalletVision"},
        content=(
            "At Visionify, Ayush is building PalletVision end-to-end with full ownership of the "
            "computer-vision detection model, the backend services, and the frontend. PalletVision "
            "is a computer-vision product for the pallet manufacturing industry that tracks pallets "
            "being built and dismantled in real time, generating productivity, grading, and "
            "dimensional analytics for pallet manufacturing teams."
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="exp-visionify-ergovision",
        category="Experience",
        metadata={"company": "Visionify Inc.", "project": "ErgoVision"},
        content=(
            "At Visionify, Ayush built ErgoVision, a mobile computer-vision app that analyzes worker "
            "body posture in real time using MediaPipe and uses GenAI to deliver personalized "
            "ergonomic improvement recommendations."
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="exp-eventstrat",
        category="Experience",
        metadata={"company": "EventStrat", "role": "Software Engineer (SDE-1)", "period": "February 2025 - August 2025"},
        content=(
            "At EventStrat, Ayush architected backend microservices for a global event-CRM platform "
            "supporting 100K+ concurrent users across international events. He constructed a "
            "fault-tolerant bulk data-ingestion pipeline (50K+ rows per file, 2K+ files per batch) "
            "with schema validation and automatic retries. He built exhibitor payment workflows "
            "supporting multi-installment plans, event-specific tax calculation, and automated payment "
            "reminders. He enabled real-time notifications and attendee tracking with a distributed, "
            "event-driven architecture on Kafka and Redis."
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="exp-sneaco",
        category="Experience",
        metadata={"company": "Sneaco.in", "role": "Software Developer Intern", "period": "February 2024 - July 2024"},
        content=(
            "At Sneaco.in, Ayush built a location-aware laundromat discovery Flutter mobile application "
            "single-handedly, enabling service discovery within a 5 km radius for doorstep pickup and "
            "delivery. He reduced backend request latency by 30% by introducing in-memory caching and "
            "optimizing REST endpoints. He integrated payment gateways, built auth services, and designed "
            "an order scheduling system for pickup and delivery logistics."
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="exp-visanka",
        category="Experience",
        metadata={"company": "Visanka Technology", "role": "Backend Developer", "period": "December 2023 - January 2024"},
        content=(
            "At Visanka Technology, Ayush led end-to-end backend development of a real-time "
            "cross-platform chat application from database schema design to API deployment. He built "
            "a real-time messaging system using Spring Boot + WebSocket, enabling instant communication "
            "between Flutter frontend and backend. He designed secure authentication flows and MongoDB "
            "data models that scaled with growing user base."
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="exp-zolatte",
        category="Experience",
        metadata={"company": "Zolatte", "role": "Flutter Developer", "period": "April 2023 - August 2023"},
        content=(
            "At Zolatte, Ayush developed CHATGURU — one of the first Hindi-language AI apps — "
            "from concept to App Store and Play Store launch. He integrated the OpenAI API to deliver "
            "conversational AI to non-English speaking users. He built an offline-first architecture "
            "with local storage. He owned the entire product lifecycle from ideation to production "
            "deployment on both app stores."
        ),
    ))

    # === Skills & Technologies ===
    chunks.append(KnowledgeChunk(
        id="skills-languages",
        category="Skills",
        content=(
            "Ayush Aryan works with these languages and databases: Java, C, Python, SQL, Dart/Flutter, "
            "HTML5, CSS3, MySQL, Firebase, MongoDB, Elasticsearch, Redis, and Apache Kafka."
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="skills-frameworks",
        category="Skills",
        content=(
            "Ayush uses these frameworks, libraries, and infrastructure: Spring Boot, Node.js, gRPC, "
            "WebSockets, Hibernate/JPA, Docker, AWS (EC2, S3), Jenkins CI/CD, Spring Cloud Gateway, "
            "Eureka, OpenFeign, Resilience4j, Prometheus, Grafana, OpenCV, and Scikit-learn."
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="skills-aiml",
        category="Skills",
        content=(
            "Ayush's AI and Machine Learning expertise includes: Computer Vision with MediaPipe "
            "(real-time models in production at Visionify), RAG (Retrieval-Augmented Generation), "
            "LLM integration, LangChain4j, embeddings and vector search (Cloudflare Workers AI), "
            "PyTorch, TensorFlow, LangChain, Hugging Face, OpenAI API, Natural Language Processing, "
            "and Deep Learning."
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="skills-tools",
        category="Skills",
        content=(
            "Ayush uses these tools and platforms: Git, Postman, Heroku, and Jupyter."
        ),
    ))

    # === Education ===
    chunks.append(KnowledgeChunk(
        id="education-btech",
        category="Education",
        content=(
            "Ayush Aryan earned a B.Tech in Data Science and Artificial Intelligence from BML Munjal "
            "University (October 2021 - June 2025, Graduated). Relevant coursework: Machine Learning "
            "& Deep Learning, Natural Language Processing, Data Structures and Algorithms, Database "
            "Management Systems, and Operating Systems."
        ),
    ))

    # === Projects ===
    chunks.append(KnowledgeChunk(
        id="project-ai-portfolio",
        category="Projects",
        content=(
            "Ayush built the AI Portfolio Assistant — this very portfolio site with an integrated "
            "RAG chatbot that answers recruiter questions about his work. It retrieves over embedded "
            "resume and project documents using Cloudflare Workers AI embeddings and vector similarity "
            "search, deployed on a zero-cost serverless stack with Vercel and Cloudflare Workers. "
            "GitHub: https://github.com/ayusharyan1309/portfolio. "
            "Live: https://ayush-aryan1309-portfolio.vercel.app"
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="project-ltxgo",
        category="Projects",
        content=(
            "Ayush built the LTXGO Ride Operations Platform — backend services for booking, dispatch, "
            "and multi-vehicle ride orchestration using Spring Boot, MySQL, JPA/Hibernate, and Liquibase. "
            "It features real-time ride tracking and notifications via WebSocket, Firebase FCM, and "
            "Redis-backed asynchronous workflows, with Flutter mobile and React CRM clients."
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="project-microservices-ecommerce",
        category="Projects",
        content=(
            "Ayush built a Microservices E-Commerce backend using Spring Boot 3.3. Features three "
            "independent services — product (MongoDB), order (MySQL), and inventory (MySQL) — with "
            "REST APIs, DTO patterns, JPA/Hibernate, and Testcontainers integration testing. "
            "GitHub: https://github.com/ayusharyan1309/microservices-based-E-Commerce-app"
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="project-chat-app",
        category="Projects",
        content=(
            "Ayush built a full-featured real-time Chat App Backend with Spring Boot 3.5 and Java 17 "
            "featuring Firebase authentication, WebSocket (STOMP over SockJS) messaging, Apache Kafka "
            "event-driven architecture, MySQL with Liquibase migrations, and AWS S3 integration. "
            "GitHub: https://github.com/ayusharyan1309/chat-app-backend"
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="project-rainfall",
        category="Projects",
        content=(
            "Ayush built a Rainfall Prediction App using Python and machine learning. The model uses "
            "the Australia Weather dataset with data preprocessing and classification algorithms to "
            "predict rainfall occurrence."
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="project-wellness",
        category="Projects",
        content=(
            "Ayush built a Wellness App Backend with Spring Boot 3.3 and Java 17. Features appointment "
            "booking with real-time slot management (Redis), blog system with image uploads (Cloudinary), "
            "JWT authentication, Kafka-powered notifications, MySQL persistence, and Docker containerization. "
            "GitHub: https://github.com/ayusharyan1309/wellness-app-backend"
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="project-sentiment",
        category="Projects",
        content=(
            "Ayush built a Sentiment Analysis system — a sentiment-based product recommendation system "
            "with Python and Flask. Uses TF-IDF vectorization and XGBoost for review sentiment "
            "classification, SMOTE for class imbalance handling, and collaborative filtering for "
            "personalized product recommendations. GitHub: https://github.com/ayusharyan1309/Sentiment-Analysis"
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="project-covid-tracker",
        category="Projects",
        content=(
            "Ayush built a Covid-19 Tracker App using Flutter and REST API, providing real-time "
            "global and country-specific COVID-19 statistics with interactive charts, country flags, "
            "and safety guidelines."
        ),
    ))
    chunks.append(KnowledgeChunk(
        id="project-ecommerce-app",
        category="Projects",
        content=(
            "Ayush built an E-Commerce App — a full-stack marketplace app built with Flutter, "
            "Node.js, and MongoDB with REST APIs, user authentication, and product management. "
            "GitHub: https://github.com/ayusharyan1309/E-CommerceApp"
        ),
    ))

    # === Certifications ===
    chunks.append(KnowledgeChunk(
        id="cert-dsa",
        category="Certifications",
        content=(
            "Ayush holds a Data Structures & Algorithms certification from Coding Ninjas. "
            "Certificate URL: https://certificate.codingninjas.com/view/dccbf8a8b00cc85c"
        ),
    ))

    # === Contact ===
    chunks.append(KnowledgeChunk(
        id="contact-info",
        category="Contact",
        content=(
        "Email: ayusharyan1309@gmail.com. Phone: +91 8340646275. Location: Hyderabad, Telangana, "
        "India. LinkedIn: https://www.linkedin.com/in/ayusharyan1309/. GitHub: https://github.com/ayusharyan1309. "
        "LeetCode: https://leetcode.com/u/ayusharyan1309/. "
        "GeeksforGeeks: https://auth.geeksforgeeks.org/user/ayusharyan1309/practice."
        ),
    ))

    # === Core Competencies ===
    chunks.append(KnowledgeChunk(
        id="competencies-list",
        category="Core Competencies",
        content=(
            "Ayush Aryan's core competencies include: Java, Spring Boot, Microservices, Apache Kafka, "
            "Redis, Distributed Systems, System Design, Event-Driven Architecture, RAG (Retrieval-Augmented "
            "Generation), LLMs, LangChain, Machine Learning, Deep Learning, Natural Language Processing, "
            "PyTorch, REST API Design, WebSocket, MongoDB, Flutter, Product Building, High-Impact "
            "Engineering, and Cloud Architecture."
        ),
    ))

    # === Impact Stats ===
    chunks.append(KnowledgeChunk(
        id="impact-stats",
        category="Impact",
        content=(
            "Ayush's impact metrics: event-driven microservices for platforms supporting 100K+ "
            "concurrent users, 10K+ events processed daily, 4 apps shipped to production, 1.5+ years "
            "of full-time SDE experience, and 3+ years building products."
        ),
    ))

    return chunks
