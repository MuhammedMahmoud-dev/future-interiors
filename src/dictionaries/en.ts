import type { Dictionary } from "./ar";

/** Typed against the Arabic dictionary — a missing key fails the build. */
export const en: Dictionary = {
  meta: {
    siteName: "Future Interiors",
    title: "Future Interiors — Engineer-supervised apartment finishing",
    description:
      "Full apartment finishing under complete engineering supervision, with an itemised statement you can follow as it happens.",
  },

  topbar: {
    call: "Call us",
    whatsapp: "WhatsApp",
  },

  nav: {
    home: "Home",
    works: "Our work",
    services: "Services",
    workSystem: "How we work",
    about: "The engineer",
    contact: "Contact",
    track: "Track your project",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    switchLang: "العربية",
  },

  hero: {
    title: "Finishing under full engineering supervision",
    ctaWorks: "See our work",
    ctaBook: "Book a site visit",
  },

  services: {
    eyebrow: "What we do",
    title: "Services",
    subtitle: "Every finishing stage under one engineering supervisor",
    viewAll: "All services",
    pageSubtitle: "What each execution stage covers in detail",
  },

  why: {
    eyebrow: "Why us",
    title: "Supervision, not contracting",
    subtitle:
      "The difference: we supervise the work and review every stage, while the contract with each supplier stays in your name.",
    points: [
      "Materials bought in your name, direct from suppliers",
      "Every invoice reaches you, with its date and value",
      "A private tracking portal for your project, open any time",
      "Daily on-site supervision, not occasional visits",
      "Each stage reviewed for quality before the next begins",
    ],
    cards: [
      {
        title: "Transparent from day one",
        body: "Every line item and every payment is in front of you as it happens — not a statement handed over at the end.",
      },
      {
        title: "The contract is yours",
        body: "We choose and check the materials, but the invoice and the contract are between you and the supplier.",
      },
      {
        title: "Delivered in stages",
        body: "Each stage is closed, photographed and reviewed before the next one starts.",
      },
    ],
  },

  works: {
    eyebrow: "Our work",
    title: "Our work",
    subtitle: "Projects delivered end to end",
    pageSubtitle: "Completed projects, published with their owners' consent",
    viewAll: "All projects",
    empty: "Projects will appear here once they are added.",
    photoAlt: "From our work",
    closeGallery: "Close",
  },

  journey: {
    eyebrow: "Step by step",
    title: "The client journey",
    subtitle: "From the first site visit to the keys",
    steps: [
      { title: "Site visit and estimate", duration: "3 days – 1 week" },
      { title: "Agreement and schedule", duration: "3 days" },
      { title: "Staged execution", duration: "Depends on area" },
      { title: "Live tracking", duration: "Throughout" },
      { title: "Handover", duration: "As agreed with the client" },
    ],
  },

  stats: {
    eyebrow: "Built on trust",
    title: "By the numbers",
  },

  testimonials: {
    eyebrow: "In their words",
    title: "What clients say",
    anonymous: "Client",
  },

  faq: {
    eyebrow: "Questions & answers",
    title: "Frequently asked",
    subtitle: "What clients ask before the work starts",
    cta: "Ask your question",
  },

  workSystem: {
    eyebrow: "How we work",
    title: "How we work",
    subtitle: "The process, step by step",
    steps: [
      {
        title: "The site visit",
        body: "We inspect the unit in person, take measurements, and agree on the finishing level and scope of work before anything else is discussed.",
      },
      {
        title: "Materials bought in your name",
        body: "Materials are purchased in your name, directly from suppliers. We select them and check the quality, but the contract and the invoice carry your name.",
      },
      {
        title: "Every invoice reaches you",
        body: "Every invoice is photographed and logged with its date and value. No line item is charged without being in front of you first.",
      },
      {
        title: "Your own tracking page",
        body: "You open your project page with your own code and find the line items, the payments and each stage's photos kept up to date — replacing the paper statement.",
      },
      {
        title: "Daily engineering supervision",
        body: "Daily on-site follow-up with the trades, and a quality check on each stage before the next one begins.",
      },
    ],
  },

  about: {
    eyebrow: "Behind the work",
    title: "The engineer",
    bioTitle: "Profile",
    syndicate: "Engineers Syndicate",
    credentials: "Qualifications and certificates",
    empty: "The engineer's details will appear here once they are added.",
  },

  contact: {
    eyebrow: "Get in touch",
    title: "Get in touch",
    subtitle: "WhatsApp is the fastest way to reach us.",
    whatsappCta: "Message us on WhatsApp",
    phone: "Phone",
  },

  track: {
    title: "Track your project",
    subtitle: "Enter your project code and the mobile number we have on file.",
    codeLabel: "Project code",
    codePlaceholder: "FI-00-0000",
    phoneLabel: "Mobile number",
    phonePlaceholder: "01xxxxxxxxx",
    submit: "Sign in",
    submitting: "Checking…",
    error: "That code or number is not correct.",
    disabled:
      "Tracking for this project is currently closed. If you need your statement, message us on WhatsApp and we will send it to you.",
    rateLimited: "Too many attempts. Please wait 15 minutes and try again.",
    unavailable: "Something went wrong. Please try again shortly.",
    help: "Do not have your code?",
    whatsappCta: "Message us on WhatsApp",
  },

  portal: {
    status: {
      in_progress: "In progress",
      completed: "Completed",
      on_hold: "On hold",
    },
    progress: "Execution progress",
    totalCost: "Total cost",
    supervisionFee: "Engineering supervision",
    grandTotal: "Grand total",
    totalPayments: "Total paid",
    balance: "Balance",
    balanceCredit: "in your favour",
    balanceDue: "due",
    currency: "EGP",
    tabs: {
      expenses: "Line items",
      payments: "Payments",
      photos: "Photos",
    },
    search: "Search line items…",
    dateFrom: "From",
    dateTo: "To",
    subtotal: "Subtotal shown",
    showing: "items",
    columns: {
      date: "Date",
      item: "Item",
      amount: "Amount",
      label: "Payment",
    },
    noExpenses: "No line items recorded yet.",
    noPayments: "No payments recorded yet.",
    noPhotos: "No photos uploaded yet.",
    noResults: "Nothing matches that search.",
    unassignedStage: "Unassigned",
    downloadPdf: "Download statement",
    print: "Print / save as PDF",
    contactEngineer: "Contact the engineer",
    logout: "Sign out",
    statementTitle: "Project statement",
    projectCode: "Project code",
    issuedAt: "Statement date",
    expensesSection: "Expenses",
    paymentsSection: "Payments received",
    summarySection: "Summary",
    whatsapp: "Hello, I have a question about my project.",
  },

  cta: {
    eyebrow: "Ready when you are",
    title: "Let's talk about your apartment",
    text: "Message us on WhatsApp and we'll arrange a site visit at a time that suits you.",
    button: "Message us on WhatsApp",
  },

  footer: {
    blurb:
      "Apartment finishing under full engineering supervision, transparent on every line item and every invoice.",
    links: "Links",
    services: "Services",
    contact: "Contact",
    social: "Follow us",
    rights: "© 2026 Future Interiors",
  },

  whatsapp: {
    float: "Message us on WhatsApp",
    book: "Hello, I would like to book a site visit for an apartment.",
    ask: "Hello, I have a question about finishing work.",
    project: "Hello, I saw the project",
    projectSuffix: "on your site and would like to know more.",
    trackHelp: "Hello, I do not have my project tracking code.",
  },

  common: {
    unavailable: "Content will appear here once it is added.",
    backHome: "Back to home",
    notFound: "Page not found",
    readMore: "Read more",
  },
};
