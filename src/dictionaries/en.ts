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
    eyebrow: "October • Sheikh Zayed • Compounds",
    title: "Finishing under full engineering supervision",
    subtitle:
      "Your apartment executed end to end, from rough-in to handover, with daily engineering supervision and an itemised statement covering every line and every invoice as it happens.",
    ctaWorks: "See our work",
    ctaBook: "Book a site visit",
  },

  services: {
    title: "Services",
    subtitle: "Every finishing stage under one engineering supervisor",
    viewAll: "All services",
    pageSubtitle: "What each execution stage covers in detail",
  },

  works: {
    title: "Our work",
    subtitle: "Projects delivered end to end",
    pageSubtitle: "Completed projects, published with their owners' consent",
    viewAll: "All projects",
    empty: "Projects will appear here once they are added.",
    filterAll: "All",
    loadMore: "Load more",
    area: "Area",
    location: "Location",
    duration: "Duration",
    year: "Year",
    months: "months",
    sqm: "m²",
  },

  project: {
    about: "About this project",
    beforeAfter: "Before and after",
    dragHint: "Drag to compare",
    before: "Before",
    after: "After",
    timeline: "Execution stages",
    gallery: "Gallery",
    ctaTitle: "Want a result like this?",
    ctaText: "Message us on WhatsApp and book a site visit.",
    ctaButton: "Book a site visit",
    related: "Other projects",
    closeGallery: "Close",
    stageDone: "Done",
    stageInProgress: "In progress",
    stageNotStarted: "Not started",
  },

  journey: {
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
    title: "By the numbers",
  },

  testimonials: {
    title: "What clients say",
    anonymous: "Client",
  },

  faq: {
    title: "Frequently asked",
    subtitle: "What clients ask before the work starts",
    cta: "Ask your question",
  },

  workSystem: {
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
    title: "The engineer",
    bioTitle: "Profile",
    syndicate: "Engineers Syndicate",
    credentials: "Qualifications and certificates",
    empty: "The engineer's details will appear here once they are added.",
  },

  contact: {
    title: "Get in touch",
    subtitle: "WhatsApp is the fastest way to reach us.",
    whatsappCta: "Message us on WhatsApp",
    phone: "Phone",
  },

  track: {
    title: "Track your project",
    soonTitle: "The tracking portal is coming soon",
    soonBody:
      "Your project page — line items, payments and stage photos — is being activated shortly. Until then, message us on WhatsApp and we will send your project statement.",
    whatsappCta: "Message us on WhatsApp",
  },

  footer: {
    blurb:
      "Apartment finishing under full engineering supervision, transparent on every line item and every invoice.",
    links: "Links",
    services: "Services",
    contact: "Contact",
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
  },
};
