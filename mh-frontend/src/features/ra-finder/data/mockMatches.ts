import { LabMatch } from "../types/labMatch";

export const mockMatches: LabMatch[] = [
  {
    id: "1",
    labTitle: "Machine Learning for Healthcare Lab",
    piName: "Dr. Sarah Chen",
    department: "Computer Sciences",
    fitScore: 92,
    blurb:
      "Developing cutting-edge AI models to predict patient outcomes and optimize treatment plans. Our lab focuses on interpretable machine learning and clinical decision support systems with real-world healthcare applications.",
    contactEmail: "s.chen@wisc.edu",
    whyMatch:
      "Your CV shows strong Python expertise and healthcare project experience. Your DARS includes relevant ML coursework (CS 540, CS 760) and your interest in data-driven healthcare solutions aligns perfectly with our research goals.",
    researchAreas: [
      "Machine Learning",
      "Healthcare AI",
      "Predictive Modeling",
      "Clinical Decision Support",
      "Deep Learning",
    ],
    labUrl: "https://mlhealth.cs.wisc.edu",
    openings: true,
    learningResources: [
      {
        title: "Introduction to Healthcare Machine Learning",
        type: "video",
        url: "https://www.youtube.com/watch?v=example1",
        description: "Stanford course on applying ML to healthcare problems",
        duration: "1 hour 23 min",
      },
      {
        title: "Clinical ML: A Guide for Medical Students",
        type: "article",
        url: "https://arxiv.org/example",
        description:
          "Comprehensive guide on ML applications in clinical settings",
      },
      {
        title: "Deep Learning in Medical Imaging",
        type: "course",
        url: "https://coursera.org/example",
        description: "Free course covering CNN applications in medical imaging",
        duration: "4 weeks",
      },
    ],
    approachTips: [
      "Review the lab's recent publications on interpretable ML for healthcare - particularly the 2024 paper on cardiac risk prediction",
      "Familiarize yourself with HIPAA compliance and ethical considerations in healthcare AI",
      "Prepare to discuss your Python experience with healthcare datasets and any experience with libraries like scikit-learn or PyTorch",
      "Consider taking the 'Healthcare Data Analysis' MOOC to strengthen your background",
      "Be ready to explain why interpretability matters in clinical decision support systems",
    ],
    relatedResearch: [
      {
        title: "Interpretable Machine Learning for Clinical Risk Prediction",
        authors: ["Chen, S.", "Johnson, M.", "Lee, K."],
        url: "https://pubmed.ncbi.nlm.nih.gov/example",
        year: 2024,
        summary:
          "This paper introduces a novel framework for creating interpretable ML models that maintain high accuracy while providing clinically meaningful explanations.",
      },
      {
        title: "Federated Learning in Healthcare: A Comprehensive Survey",
        authors: ["Wang, L.", "Chen, S."],
        url: "https://arxiv.org/example2",
        year: 2023,
        summary:
          "Reviews privacy-preserving ML techniques for healthcare applications, focusing on federated learning approaches.",
      },
    ],
    emailTemplateData: {
      subjectSuggestions: [
        "Prospective RA interested in Healthcare ML - [Your Name]",
        "CS Student Seeking RA Position in ML Healthcare Lab",
        "Application for Research Assistant Position - Healthcare AI Interest",
      ],
      keyPoints: [
        "Completed CS 540 (Intro to AI) and CS 760 (Machine Learning) with A grades",
        "Built a COVID-19 prediction model using Python and scikit-learn for class project",
        "Strong foundation in statistics and data analysis from STAT 324",
        "Experience with healthcare data through volunteer work at UW Hospital",
      ],
      researchAlignment:
        "Your recent work on interpretable ML for cardiac risk prediction deeply resonates with my interest in creating AI systems that clinicians can trust and understand. My experience building a COVID-19 severity prediction model taught me the importance of model transparency in healthcare applications.",
      personalizedHooks: [
        "I was particularly inspired by your TEDx talk on 'Making AI Understandable for Doctors' and how it aligns with my goal of bridging technology and medicine.",
        "Your lab's approach to combining deep learning with clinical interpretability addresses exactly the challenges I want to tackle in my research career.",
      ],
    },
  },
  {
    id: "2",
    labTitle: "Computational Biology & Genomics Group",
    piName: "Dr. Michael Rodriguez",
    department: "Biochemistry",
    fitScore: 85,
    blurb:
      "Analyzing large-scale genomic datasets to understand disease mechanisms and develop personalized medicine approaches. We combine bioinformatics, statistics, and molecular biology to unlock the secrets of the genome.",
    contactEmail: "mrodriguez@wisc.edu",
    whyMatch:
      "Strong match with your bioinformatics coursework and Python/R skills. Your interest in data analysis and biological systems aligns with our computational approaches to genomics research.",
    researchAreas: [
      "Genomics",
      "Bioinformatics",
      "Statistical Analysis",
      "Personalized Medicine",
      "Systems Biology",
    ],
    openings: false,
    learningResources: [
      {
        title: "Introduction to Bioinformatics",
        type: "course",
        url: "https://www.edx.org/bioinformatics",
        description: "MIT course covering computational methods in biology",
        duration: "6 weeks",
      },
      {
        title: "Genomics Data Analysis with R/Bioconductor",
        type: "video",
        url: "https://www.youtube.com/bioconductor",
        description: "Practical tutorial on analyzing genomic data using R",
        duration: "2 hours 15 min",
      },
      {
        title: "GWAS and Population Genetics",
        type: "paper",
        url: "https://www.nature.com/articles/gwas-review",
        description: "Comprehensive review of genome-wide association studies",
      },
    ],
    approachTips: [
      "Brush up on your R programming skills - the lab primarily uses R/Bioconductor for genomics analysis",
      "Read about GWAS (Genome-Wide Association Studies) methodology and statistical genetics",
      "Familiarize yourself with common genomics file formats like VCF, BED, and FASTA",
      "Review basic population genetics concepts and Hardy-Weinberg equilibrium",
      "Consider taking BIOSTAT 577 (Statistical Genetics) if you haven't already",
    ],
    relatedResearch: [
      {
        title:
          "Multi-ancestry GWAS reveals novel genetic variants for complex traits",
        authors: ["Rodriguez, M.", "Smith, J.", "Kim, H."],
        url: "https://www.nature.com/articles/example-gwas",
        year: 2024,
        summary:
          "Large-scale genomic study identifying new genetic variants associated with metabolic diseases across diverse populations.",
      },
      {
        title: "Computational methods for polygenic risk scores",
        authors: ["Liu, X.", "Rodriguez, M."],
        url: "https://journals.plos.org/plosgenetics/example",
        year: 2023,
        summary:
          "Novel computational approaches for calculating and interpreting polygenic risk scores for disease prediction.",
      },
    ],
    emailTemplateData: {
      subjectSuggestions: [
        "Bioinformatics Student Interested in Genomics Research - [Your Name]",
        "RA Application for Computational Biology Lab",
        "Graduate Student Seeking Position in Genomics Research",
      ],
      keyPoints: [
        "Strong background in statistics and data analysis (STAT 324, STAT 371)",
        "Proficient in R programming and experienced with biological data analysis",
        "Completed coursework in genetics and molecular biology",
        "Experience with large datasets and statistical computing",
      ],
      researchAlignment:
        "Your innovative work on multi-ancestry GWAS particularly interests me because of my passion for understanding genetic diversity and its implications for personalized medicine. My background in statistical analysis and interest in population genetics align well with your lab's computational approaches.",
      personalizedHooks: [
        "Your recent Nature paper on multi-ancestry GWAS inspired my senior thesis on genetic variants in diverse populations.",
        "I'm particularly excited about your lab's focus on making genomics research more inclusive and representative of global genetic diversity.",
      ],
    },
  },
  {
    id: "3",
    labTitle: "Human-Computer Interaction Lab",
    piName: "Dr. Emily Thompson",
    department: "Computer Sciences",
    fitScore: 78,
    blurb:
      "Designing accessible technologies and studying user behavior in immersive VR/AR environments. Our research focuses on inclusive design principles and creating technology that works for everyone.",
    contactEmail: "ethompson@wisc.edu",
    whyMatch:
      "Your UX design experience and psychology minor create an interdisciplinary fit. HCI coursework (CS 571) and portfolio projects demonstrate strong foundation in user-centered design principles.",
    researchAreas: [
      "HCI",
      "Accessibility",
      "VR/AR",
      "User Research",
      "Inclusive Design",
      "Usability Testing",
    ],
    labUrl: "https://hci.cs.wisc.edu",
    openings: true,
    learningResources: [
      {
        title: "Introduction to Human-Computer Interaction",
        type: "course",
        url: "https://www.coursera.org/learn/intro-hci",
        description: "Comprehensive introduction to HCI principles and methods",
        duration: "5 weeks",
      },
      {
        title: "Accessibility in Design",
        type: "video",
        url: "https://www.youtube.com/watch?v=accessibility-design",
        description:
          "Google Design workshop on creating accessible user interfaces",
        duration: "45 minutes",
      },
      {
        title: "VR/AR User Experience Research Methods",
        type: "article",
        url: "https://doi.org/vr-ux-methods",
        description:
          "Research paper on user testing methodologies for immersive technologies",
      },
    ],
    approachTips: [
      "Review the lab's recent publications on VR accessibility - especially the 2024 CHI paper on haptic feedback",
      "Familiarize yourself with user research methods like usability testing, interviews, and surveys",
      "Learn about WCAG accessibility guidelines and inclusive design principles",
      "If possible, try some VR/AR applications and think critically about their user experience",
      "Consider taking Psychology 202 (Research Methods) to strengthen your research background",
    ],
    relatedResearch: [
      {
        title: "Haptic Feedback for Accessible VR Navigation",
        authors: ["Thompson, E.", "Davis, A.", "Wilson, P."],
        url: "https://dl.acm.org/doi/haptic-vr",
        year: 2024,
        summary:
          "Novel haptic interface design that enables visually impaired users to navigate virtual environments effectively.",
      },
      {
        title: "Cross-Cultural Usability in AR Applications",
        authors: ["Chen, L.", "Thompson, E."],
        url: "https://journals.hci.org/cross-cultural-ar",
        year: 2023,
        summary:
          "Study examining how cultural factors influence user interaction patterns in augmented reality applications.",
      },
    ],
    emailTemplateData: {
      subjectSuggestions: [
        "UX Design Student Interested in HCI Research - [Your Name]",
        "Psychology Minor Seeking RA Position in HCI Lab",
        "Student with Accessibility Interest - Research Assistant Application",
      ],
      keyPoints: [
        "Completed CS 571 (Human-Computer Interaction) with focus on accessibility",
        "Psychology minor with coursework in cognitive science and research methods",
        "Portfolio includes several UX design projects with user testing experience",
        "Passionate about inclusive design and creating technology for diverse users",
      ],
      researchAlignment:
        "Your groundbreaking work on haptic feedback for VR accessibility resonates deeply with my commitment to inclusive design. My psychology background and UX design experience provide a strong foundation for understanding user needs and conducting meaningful research in accessible technology.",
      personalizedHooks: [
        "Your CHI 2024 paper on haptic VR navigation inspired my final project in CS 571, where I designed accessible interfaces for visually impaired users.",
        "I'm particularly drawn to your lab's mission of creating technology that works for everyone, which aligns with my personal values and career goals in accessible design.",
      ],
    },
  },
  {
    id: "4",
    labTitle: "Climate Data Analytics Research Group",
    piName: "Dr. James Wang",
    department: "Atmospheric & Oceanic Sciences",
    fitScore: 74,
    blurb:
      "Using big data analytics and machine learning to understand climate patterns and predict environmental changes. We work with satellite data, weather models, and advanced statistical techniques.",
    contactEmail: "jwang@aos.wisc.edu",
    whyMatch:
      "Your data science skills and environmental science minor are valuable assets. Experience with Python data analysis libraries and interest in climate change make you a good fit for our computational projects.",
    researchAreas: [
      "Climate Science",
      "Data Analytics",
      "Environmental Modeling",
      "Satellite Data",
      "Time Series Analysis",
    ],
    labUrl: "https://climate.aos.wisc.edu",
    openings: true,
    learningResources: [
      {
        title: "Climate Data Analysis with Python",
        type: "course",
        url: "https://www.edx.org/course/climate-data-python",
        description:
          "Learn to analyze climate datasets using Python and pandas",
        duration: "8 weeks",
      },
      {
        title: "Introduction to Satellite Remote Sensing",
        type: "video",
        url: "https://www.youtube.com/satellite-remote-sensing",
        description: "NASA tutorial on satellite data processing and analysis",
        duration: "1 hour 30 min",
      },
      {
        title: "Time Series Analysis for Environmental Data",
        type: "paper",
        url: "https://doi.org/time-series-env",
        description:
          "Comprehensive review of statistical methods for environmental time series",
      },
    ],
    approachTips: [
      "Strengthen your Python skills, particularly with pandas, numpy, and matplotlib for data analysis",
      "Learn about climate data formats like NetCDF and HDF5",
      "Familiarize yourself with basic meteorology and climatology concepts",
      "Review time series analysis methods and their applications to climate data",
      "Consider taking AOS 340 (Climate and Climate Change) for domain knowledge",
    ],
    relatedResearch: [
      {
        title: "Machine Learning Applications in Climate Prediction",
        authors: ["Wang, J.", "Martinez, S.", "Brown, K."],
        url: "https://journals.climate.org/ml-climate",
        year: 2024,
        summary:
          "Comprehensive study on using ensemble ML methods to improve seasonal climate forecasting accuracy.",
      },
      {
        title: "Satellite-based monitoring of Arctic sea ice trends",
        authors: ["Johnson, R.", "Wang, J."],
        url: "https://www.nature.com/articles/arctic-ice",
        year: 2023,
        summary:
          "Analysis of 40-year satellite record revealing accelerating Arctic sea ice loss and its implications for global climate.",
      },
    ],
    emailTemplateData: {
      subjectSuggestions: [
        "Environmental Science Student Interested in Climate Data Research - [Your Name]",
        "Data Science Student Seeking RA Position in Climate Analytics",
        "Undergraduate Researcher - Climate Data Analysis Lab Application",
      ],
      keyPoints: [
        "Strong background in Python programming and data analysis libraries",
        "Environmental science coursework including climate and atmospheric science",
        "Experience with statistical analysis and time series data",
        "Passionate about using data science to address climate change",
      ],
      researchAlignment:
        "Your innovative application of machine learning to climate prediction particularly excites me because it combines my passion for environmental science with my data analysis skills. I'm especially interested in how satellite data can help us understand and predict climate patterns in the context of global change.",
      personalizedHooks: [
        "Your recent publication on ML-enhanced climate prediction inspired my senior capstone project on predicting extreme weather events using satellite data.",
        "I'm particularly drawn to your lab's work because it directly addresses one of the most pressing challenges of our time through cutting-edge data science approaches.",
      ],
    },
  },
];
