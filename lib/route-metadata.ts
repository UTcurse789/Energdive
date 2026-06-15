import type { Metadata } from "next";

type ExactPageMetadataInput = {
  title: string;
  description: string;
  keywords: string;
  author: string;
  publisher: string;
  generator: string;
  classification: string;
  topic: string;
  audience: string;
  canonical: string;
  openGraph: {
    title: string;
    description: string;
    url: string;
    siteName: string;
    locale?: string;
    imageAlt?: string;
  };
  twitter: {
    title: string;
    description: string;
    site: string;
  };
  languages?: Record<string, string>;
};

const OG_IMAGE_URL = "https://www.energdive.com/og-image.jpg";

function buildExactPageMetadata(input: ExactPageMetadataInput): Metadata {
  return {
    title: {
      absolute: input.title,
    },
    description: input.description,
    keywords: input.keywords,
    authors: [{ name: input.author }],
    publisher: input.publisher,
    generator: input.generator,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    alternates: {
      canonical: input.canonical,
      ...(input.languages ? { languages: input.languages } : {}),
    },
    openGraph: {
      ...(input.openGraph.locale ? { locale: input.openGraph.locale } : {}),
      title: input.openGraph.title,
      description: input.openGraph.description,
      url: input.openGraph.url,
      type: "website",
      siteName: input.openGraph.siteName,
      images: [
        {
          url: OG_IMAGE_URL,
          ...(input.openGraph.imageAlt ? { alt: input.openGraph.imageAlt } : {}),
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.twitter.title,
      description: input.twitter.description,
      site: input.twitter.site,
    },
    other: {
      classification: input.classification,
      topic: input.topic,
      audience: input.audience,
      distribution: "global",
      language: "English",
      copyright: "© 2026 ENERGDIVE",
      city: "New Delhi",
      state: "Delhi",
      location: "New Delhi, India",
    },
  };
}

export const HOME_PAGE_METADATA = buildExactPageMetadata({
  title: "Energy Intelligence Platform for India | News & Insights | ENERGDIVE",
  description:
    "ENERGDIVE is India's strategic energy intelligence platform delivering insights, expert analysis, news, and intelligence on energy sectors.",
  keywords:
    "energy intelligence platform, energdive, energy dive, energdive magazine, energy dive magazine, energydive magazine, energ dive magazine, energy magazine, energ magazine, energy magazine india",
  author: "ENERGDIVE Insights and Market Intelligence",
  publisher: "ENERGDIVE Insights and Market Intelligence",
  generator: "ENERGDIVE Insights and Market Intelligence",
  classification: "Energy Media & Intelligence",
  topic: "India Energy Sector - News, Analysis and Magazine",
  audience:
    "Government bodies, policymakers, industry leaders, corporates, investors, researchers",
  canonical: "https://www.energdive.com/",
  openGraph: {
    locale: "en_IN",
    title:
      "ENERGDIVE - Insights and Market Intelligence | ENERGDIVE Magazine | India's Energy Intelligence Platform",
    description:
      "ENERGDIVE is India's strategic energy intelligence platform delivering insights, expert analysis, news, and intelligence on energy sectors.",
    url: "https://www.energdive.com/",
    siteName: "ENERGDIVE - Insights and Market Intelligence",
    imageAlt: "ENERGDIVE - India's Energy Intelligence Platform",
  },
  twitter: {
    title:
      "ENERGDIVE - Insights and Market Intelligence | ENERGDIVE Magazine | India's Energy Intelligence Platform",
    description:
      "ENERGDIVE is India's strategic energy intelligence platform delivering insights, expert analysis, news, and intelligence on energy sectors.",
    site: "@energdive",
  },
  languages: {
    "en-in": "https://www.energdive.com/",
    "x-default": "https://www.energdive.com/",
  },
});

export const ABOUT_PAGE_METADATA = buildExactPageMetadata({
  title: "About ENERGDIVE | India's Energy Intelligence Platform",
  description:
    "ENERGDIVE is India's strategic energy intelligence platform covering policy, leadership, innovation, and market insights across India's energy transition.",
  keywords:
    "about energdive, energdive, energdive magazine, energydive magazine, energy dive, energy dive magazine, energ dive magazine, india energy intelligence platform, energy transition insights, energy policy analysis, energy leadership platform, energy market intelligence",
  author: "ENERGDIVE - Insights and Market Intelligence",
  publisher: "ENERGDIVE - Insights and Market Intelligence",
  generator: "ENERGDIVE - Insights and Market Intelligence",
  classification: "Energy Media & Intelligence",
  topic: "India Energy Sector - News, Analysis and Magazine",
  audience:
    "Government bodies, policymakers, industry leaders, corporates, investors, researchers",
  canonical: "https://www.energdive.com/about",
  openGraph: {
    locale: "en_IN",
    title: "About ENERGDIVE | India's Energy Intelligence Platform",
    description:
      "ENERGDIVE is India's strategic energy intelligence platform delivering insights, expert analysis, news, and intelligence on energy sectors.",
    url: "https://www.energdive.com/about",
    siteName: "ENERGDIVE - Insights and Market Intelligence",
    imageAlt: "ENERGDIVE - India's Energy Intelligence Platform",
  },
  twitter: {
    title:
      "ENERGDIVE - Insights and Market Intelligence | ENERGDIVE Magazine | India's Energy Intelligence Platform",
    description:
      "ENERGDIVE is India's strategic energy intelligence platform delivering insights, expert analysis, news, and intelligence on energy sectors.",
    site: "@energdive",
  },
  languages: {
    "en-in": "https://www.energdive.com/about",
    "x-default": "https://www.energdive.com/about",
  },
});

export const NEWS_PAGE_METADATA = buildExactPageMetadata({
  title: "Latest Energy News, Insights & Analysis | ENERGDIVE",
  description:
    "Your daily source for energy news, market trends and industry intelligence across the technologies transforming the global energy landscape.",
  keywords:
    "energy news, latest energy news, energy sector news, energy market news, energy industry news, power sector news, renewable energy news, oil and gas news, clean energy news, electricity market news, hydrogen energy news, energy storage news, sustainability news, global energy trends, energy business news",
  author: "ENERGDIVE - Insights and Market Intelligence",
  publisher: "ENERGDIVE - Insights and Market Intelligence",
  generator: "ENERGDIVE - Insights and Market Intelligence",
  classification: "Energy News & Current Affairs",
  topic: "Energy Sector News | Oil & Gas, Power, Renewables, Policy & Markets",
  audience:
    "Government bodies, policymakers, industry leaders, corporates, investors, researchers",
  canonical: "https://www.energdive.com/news",
  openGraph: {
    locale: "en_IN",
    title: "Energy Sectors News | Oil, Gas, Power & Renewables",
    description:
      "Stay updated with the latest energy sector news covering oil & gas, power generation, renewable energy, clean energy policy, and electricity markets on ENERGDIVE.",
    url: "https://www.energdive.com/news",
    siteName: "ENERGDIVE - Insights and Market Intelligence",
    imageAlt: "ENERGDIVE - India's Energy Intelligence Platform",
  },
  twitter: {
    title: "Energy Sectors News | Oil, Gas, Power & Renewables",
    description:
      "Stay updated with the latest energy sector news covering oil & gas, power generation, renewable energy, clean energy policy, and electricity markets on ENERGDIVE.",
    site: "@energdive",
  },
  languages: {
    "en-in": "https://www.energdive.com/news",
    "x-default": "https://www.energdive.com/news",
  },
});

export const REPORTS_PAGE_METADATA = buildExactPageMetadata({
  title: "Energy Market Reports, Insights & Industry Analysis | ENERGDIVE",
  description:
    "Access in-depth energy reports covering oil & gas, renewables, power markets, policy analysis, and sector data curated by ENERGDIVE for energy professionals.",
  keywords:
    "energy reports, energy industry reports, energy sector analysis, energy market intelligence, hse report, downstream report, industry reports, energy industry reports",
  author: "ENERGDIVE - Insights and Market Intelligence",
  publisher: "ENERGDIVE - Insights and Market Intelligence",
  generator: "ENERGDIVE - Insights and Market Intelligence",
  classification: "Energy News & Current Affairs",
  topic: "Energy Sector News | Oil & Gas, Power, Renewables, Policy & Markets",
  audience:
    "Government bodies, policymakers, industry leaders, corporates, investors, researchers",
  canonical: "https://www.energdive.com/reports",
  openGraph: {
    locale: "en_IN",
    title: "Energy Reports | Sector Analysis & Intelligence",
    description:
      "Access in-depth energy reports covering oil & gas, renewables, power markets, policy analysis, and sector data curated by ENERGDIVE for energy professionals.",
    url: "https://www.energdive.com/reports",
    siteName: "ENERGDIVE - Insights and Market Intelligence",
    imageAlt: "ENERGDIVE - India's Energy Intelligence Platform",
  },
  twitter: {
    title: "Energy Reports | Sector Analysis & Intelligence",
    description:
      "Access in-depth energy reports covering oil & gas, renewables, power markets, policy analysis, and sector data curated by ENERGDIVE for energy professionals.",
    site: "@energdive",
  },
  languages: {
    "en-in": "https://www.energdive.com/reports",
    "x-default": "https://www.energdive.com/reports",
  },
});

export const OPINION_PAGE_METADATA = buildExactPageMetadata({
  title: "Energy Opinions, Expert Perspectives & Industry Insights | ENERGDIVE",
  description:
    "Read expert opinions on energy sector leadership perspectives, policy commentary, CEO insights, and strategic views on energy transition from ENERGDIVE.",
  keywords:
    "opinion, energy expert insights, energy leadership opinions, oil and gas expert views, power sector insights, energy policy opinions, renewable energy thought leadership, energy opinion, energy insights, expert perspectives, thought leadership, industry insights, editorial insights, sector perspectives",
  author: "ENERGDIVE - Insights and Market Intelligence",
  publisher: "ENERGDIVE - Insights and Market Intelligence",
  generator: "ENERGDIVE - Insights and Market Intelligence",
  classification: "Energy Thought Leadership & Opinion",
  topic: "Expert Views, Leadership Perspectives & Policy Opinions on Energy Sectors",
  audience:
    "Government bodies, policymakers, industry leaders, corporates, investors, researchers",
  canonical: "https://www.energdive.com/opinion",
  openGraph: {
    locale: "en_IN",
    title: "Energy Opinion | Expert Views & Leadership",
    description:
      "Read expert opinions on energy sector leadership perspectives, policy commentary, CEO insights, and strategic views on energy transition from ENERGDIVE.",
    url: "https://www.energdive.com/opinion",
    siteName: "ENERGDIVE - Insights and Market Intelligence",
    imageAlt: "ENERGDIVE - India's Energy Intelligence Platform",
  },
  twitter: {
    title: "Energy Opinion | Expert Views & Leadership",
    description:
      "Read expert opinions on energy sector leadership perspectives, policy commentary, CEO insights, and strategic views on energy transition from ENERGDIVE.",
    site: "@energdive",
  },
  languages: {
    "en-in": "https://www.energdive.com/opinion",
    "x-default": "https://www.energdive.com/opinion",
  },
});

export const INTERVIEWS_PAGE_METADATA = buildExactPageMetadata({
  title:
    "Energy Interviews, Leadership Conversations & Industry Insights | ENERGDIVE",
  description:
    "Exclusive interviews with energy leaders CEOs, policymakers, innovators, and sector experts sharing insights on energy transition on ENERGDIVE.",
  keywords:
    "interview, energy leadership interviews, energy expert insights, interviews, energy interviews, industry interviews, leadership interviews, expert interviews, energy leaders, expert perspectives, industry conversations, leadership perspectives",
  author: "ENERGDIVE - Insights and Market Intelligence",
  publisher: "ENERGDIVE - Insights and Market Intelligence",
  generator: "ENERGDIVE - Insights and Market Intelligence",
  classification: "Energy Leadership Interviews & Executive Conversations",
  topic: "Interviews with Energy Sector Leaders CEOs, Policymakers & Innovators",
  audience:
    "Government bodies, policymakers, industry leaders, corporates, investors, researchers",
  canonical: "https://www.energdive.com/interviews",
  openGraph: {
    locale: "en_IN",
    title: "Energy Interviews | Leaders & Expert Voices",
    description:
      "Exclusive interviews with energy leaders CEOs, policymakers, innovators, and sector experts sharing insights on energy transition on ENERGDIVE.",
    url: "https://www.energdive.com/interviews",
    siteName: "ENERGDIVE - Insights and Market Intelligence",
    imageAlt: "ENERGDIVE - India's Energy Intelligence Platform",
  },
  twitter: {
    title: "Energy Interviews | Leaders & Expert Voices",
    description:
      "Exclusive interviews with energy leaders CEOs, policymakers, innovators, and sector experts sharing insights on energy transition on ENERGDIVE.",
    site: "@energdive",
  },
  languages: {
    "en-in": "https://www.energdive.com/interviews",
    "x-default": "https://www.energdive.com/interviews",
  },
});

export const VIDEOS_PAGE_METADATA = buildExactPageMetadata({
  title: "Energy Videos, Interviews & Industry Perspectives | ENERGDIVE",
  description:
    "Watch energy experts, CEOs, and policymakers on ENERGDIVE expert talks, leadership interviews, panel discussions, and insights on energy sector.",
  keywords:
    "video interviews, leadership conversations, expert perspectives, industry coverage, strategic insights, thought leadership videos, energy videos, industry videos, expert videos, energy interviews",
  author: "ClariSector Technologies Pvt. Ltd.",
  publisher: "ENERGDIVE",
  generator: "ClariSector Technologies Pvt. Ltd.",
  classification:
    "Energy Video Platform, Expert Talks Platform, Industry Insights Portal",
  topic:
    "Energy Videos, Expert Talks, Interviews, Policy Insights, Oil & Gas, Power, Renewables, Sustainability",
  audience:
    "Energy professionals, policymakers, industry leaders, corporates, investors, researchers",
  canonical: "https://www.energdive.com/videos",
  openGraph: {
    title: "Energy Videos & Expert Talks India | ENERGDIVE",
    description:
      "Watch expert conversations and leadership insights shaping India's energy transition across oil & gas, power, renewables, and sustainability.",
    url: "https://www.energdive.com/videos",
    siteName: "ENERGDIVE",
  },
  twitter: {
    title: "Energy Videos & Expert Talks India | ENERGDIVE",
    description:
      "Explore expert conversations, interviews, and insights shaping India's energy future.",
    site: "@energdive",
  },
});

export const EVENTS_PAGE_METADATA = buildExactPageMetadata({
  title:
    "Energy Events & Conferences India | Oil & Gas, Power & Renewables | ENERGDIVE",
  description:
    "Stay connected with major energy conferences, leadership forums and sector-focused events covering power, oil & gas, renewables, sustainability and emerging technologies.",
  keywords:
    "energy events, energy conferences, energy exhibitions, energy summit, energy forums, energy networking events, energy industry conferences, india energy events calendar, global refining petrochemicals congress grpc, bharat fire & safety congress, bharat electricity forum, middle east energy event, oilspill india, international process safety conference inpsc, energy industry events, energy leadership summit, energy networking events, energy business conferences, energy forums and summits",
  author: "ClariSector Technologies Pvt. Ltd.",
  publisher: "ENERGDIVE",
  generator: "ClariSector Technologies Pvt. Ltd.",
  classification:
    "Energy Events Platform, Industry Conferences Portal, Energy Networking Platform",
  topic:
    "Energy Events, Conferences, Exhibitions, Oil & Gas, Power, Renewables, Sustainability",
  audience:
    "Energy professionals, policymakers, corporates, investors, exhibitors, event participants",
  canonical: "https://www.energdive.com/events",
  openGraph: {
    title: "Energy Events & Conferences India | ENERGDIVE",
    description:
      "Explore upcoming energy events, conferences, and exhibitions shaping India's energy ecosystem across oil & gas, power, renewables, and sustainability.",
    url: "https://www.energdive.com/events",
    siteName: "ENERGDIVE",
  },
  twitter: {
    title: "Energy Events & Conferences India | ENERGDIVE",
    description:
      "Stay updated on energy conferences, exhibitions, and industry events shaping India's energy future.",
    site: "@energdive",
  },
});

export const ISSUES_PAGE_METADATA = buildExactPageMetadata({
  title: "ENERGDIVE Magazine Issues | Energy Insights & Special Editions",
  description:
    "A curated archive issues of ENERGDIVE covering power, oil & gas, renewables, markets, sustainability and emerging energy technologies.",
  keywords:
    "energy magazine india, india energy magazine, monthly energy magazine, energy sector magazine, oil and gas magazine, power sector magazine, renewable energy magazine, energy industry magazine, energy magazine, energy magazine archive, energy magazine issues, industry magazine, energy publications, digital magazine, energy market analysis, solar magazine india",
  author: "ClariSector Technologies Pvt. Ltd.",
  publisher: "ENERGDIVE",
  generator: "ClariSector Technologies Pvt. Ltd.",
  classification:
    "Energy Magazine, Energy Intelligence Publication, Industry Knowledge Platform",
  topic:
    "Energy Magazine, Energy Transition, Policy Insights, Oil & Gas, Power, Renewables, Sustainability",
  audience:
    "Energy professionals, policymakers, industry leaders, corporates, investors, researchers",
  canonical: "https://www.energdive.com/issues",
  openGraph: {
    title: "ENERGDIVE Magazine | India's Energy Intelligence Publication",
    description:
      "Discover ENERGDIVE Magazine editions covering India's energy transition, policy insights, industry trends, and leadership perspectives.",
    url: "https://www.energdive.com/issues",
    siteName: "ENERGDIVE",
  },
  twitter: {
    title: "ENERGDIVE Magazine | India's Energy Intelligence Platform",
    description:
      "Explore monthly editions of ENERGDIVE Magazine covering energy transition, policy, innovation, and industry insights.",
    site: "@energdive",
  },
});

export const CONTACT_PAGE_METADATA = buildExactPageMetadata({
  title:
    "Contact ENERGDIVE | Editorial, Advertising & Support | India Energy Platform",
  description:
    "Get in touch with ENERGDIVE for editorial inquiries, advertising opportunities, partnerships, subscriptions, and general support. Connect with India's leading energy intelligence platform.",
  keywords:
    "contact energdive, energdive contact, energdive media contact, energdive editorial contact, energdive advertising contact, energdive sponsorship contact, energdive subscription contact",
  author: "ClariSector Technologies Pvt. Ltd.",
  publisher: "ENERGDIVE",
  generator: "ClariSector Technologies Pvt. Ltd.",
  classification: "Contact Page, Business Inquiry Page, Energy Media Platform",
  topic: "Contact, Editorial, Advertising, Partnerships, Subscriptions, Support",
  audience:
    "Energy professionals, advertisers, partners, subscribers, corporates, policymakers",
  canonical: "https://www.energdive.com/contact",
  openGraph: {
    title: "Contact ENERGDIVE | Energy Intelligence Platform",
    description:
      "Reach out to ENERGDIVE for editorial queries, advertising opportunities, partnerships, and support across India's energy ecosystem.",
    url: "https://www.energdive.com/contact",
    siteName: "ENERGDIVE",
  },
  twitter: {
    title: "Contact ENERGDIVE | Energy Platform India",
    description:
      "Connect with ENERGDIVE for editorial, advertising, partnerships, and subscription inquiries.",
    site: "@energdive",
  },
});

export const SUBSCRIBE_PAGE_METADATA = buildExactPageMetadata({
  title: "Subscribe to ENERGDIVE Magazine | India's Energy Intelligence Platform",
  description:
    "Subscribe to ENERGDIVE Magazine and get curated insights on India's energy transition, policy, oil & gas, power, renewables, and sustainability delivered to your desk every month.",
  keywords:
    "energy intelligence magazine subscription, oil and gas magazine subscription, power sector magazine subscription, renewable energy magazine subscription, energy magazine subscription, industry magazine subscription, digital energy magazine subscription",
  author: "ClariSector Technologies Pvt. Ltd.",
  publisher: "ENERGDIVE",
  generator: "ClariSector Technologies Pvt. Ltd.",
  classification:
    "Subscription Page, Energy Magazine Subscription Platform, Energy Intelligence Platform",
  topic:
    "Subscription, Energy Magazine, Energy Insights, Policy, Oil & Gas, Power, Renewables",
  audience:
    "Energy professionals, policymakers, corporates, industry leaders, researchers, subscribers",
  canonical: "https://www.energdive.com/subscribe",
  openGraph: {
    title: "Subscribe to ENERGDIVE Magazine",
    description:
      "Get monthly insights on India's energy transition, policy, and industry trends by subscribing to ENERGDIVE Magazine.",
    url: "https://www.energdive.com/subscribe",
    siteName: "ENERGDIVE",
  },
  twitter: {
    title: "Subscribe to ENERGDIVE Magazine",
    description:
      "Subscribe and receive curated energy insights, policy updates, and industry intelligence every month.",
    site: "@energdive",
  },
});

export const ADVERTISE_PAGE_METADATA = buildExactPageMetadata({
  title:
    "Advertise with ENERGDIVE | Energy Media, Marketing & Industry Visibility Platform",
  description:
    "Advertise with ENERGDIVE and position your brand at the forefront of India's energy transition. Reach policymakers, industry leaders, and decision-makers through premium media, content, and strategic partnerships.",
  keywords:
    "energy industry advertising, advertise energy business, B2B advertising, energy advertising, industry advertising, advertise with us, advertise your business, advertising opportunities, online advertising platform, digital advertising, magazine advertising, digital magazine advertising, sponsored content",
  author: "ClariSector Technologies Pvt. Ltd.",
  publisher: "ENERGDIVE",
  generator: "ClariSector Technologies Pvt. Ltd.",
  classification:
    "Advertising Platform, Energy Media Platform, B2B Marketing Platform",
  topic: "Advertising, Media Partnerships, Brand Promotion, Energy Industry Marketing",
  audience:
    "Energy companies, corporates, marketers, advertisers, agencies, industry leaders",
  canonical: "https://www.energdive.com/advertise",
  openGraph: {
    title: "Advertise with ENERGDIVE | Energy Media Platform",
    description:
      "Partner with ENERGDIVE to position your brand at the center of India's energy transition through strategic media, content, and industry engagement.",
    url: "https://www.energdive.com/advertise",
    siteName: "ENERGDIVE",
  },
  twitter: {
    title: "Advertise with ENERGDIVE | Energy Industry Marketing Platform",
    description:
      "Reach decision-makers in India's energy sector through ENERGDIVE's premium media and advertising solutions.",
    site: "@energdive",
  },
});

export const EDITORIAL_COLLABORATION_PAGE_METADATA = buildExactPageMetadata({
  title:
    "Editorial Collaboration with ENERGDIVE | Contribute Insights & Thought Leadership",
  description:
    "Collaborate with ENERGDIVE editorially by sharing expert viewpoints, commentary, and research-backed analysis on the energy sector.",
  keywords:
    "editorial collaboration, editorial partnerships, contribute to energdive, energy thought leadership, energy commentary, policy analysis submission, expert editorial contributions, energy guest article, editorial enquiry, industry insights submission",
  author: "ClariSector Technologies Pvt. Ltd.",
  publisher: "ENERGDIVE",
  generator: "ClariSector Technologies Pvt. Ltd.",
  classification:
    "Editorial Collaboration, Thought Leadership, Energy Media Platform",
  topic:
    "Editorial Partnerships, Expert Contributions, Thought Leadership, Energy Sector Commentary",
  audience:
    "Thought leaders, researchers, policymakers, industry experts, authors, contributors",
  canonical: "https://www.energdive.com/editorial-collaboration",
  openGraph: {
    title: "Editorial Collaboration with ENERGDIVE",
    description:
      "Pitch editorials, expert commentary, and thought-leadership ideas to the ENERGDIVE editorial team.",
    url: "https://www.energdive.com/editorial-collaboration",
    siteName: "ENERGDIVE",
  },
  twitter: {
    title: "Editorial Collaboration with ENERGDIVE",
    description:
      "Share expert energy insights, editorial ideas, and strategic commentary with the ENERGDIVE team.",
    site: "@energdive",
  },
});

export const EIX_PAGE_METADATA = buildExactPageMetadata({
  title:
    "ENERGDIVE Insights Exchange | Research Papers, Case Studies & Energy Knowledge",
  description:
    "Explore the ENERGDIVE Insights Exchange, a curated knowledge platform for research papers, sector outlooks, case studies, white papers, technical notes, and knowledge briefs on India's energy transition.",
  keywords:
    "ENERGDIVE Insights Exchange, EIX, energy research papers India, energy case studies, energy white papers, energy sector outlooks, technical notes energy, knowledge briefs energy transition, ENERGClub research platform",
  author: "ClariSector Technologies Pvt. Ltd.",
  publisher: "ENERGDIVE/ENERGClub",
  generator: "ClariSector Technologies Pvt. Ltd.",
  classification:
    "Energy Knowledge Platform, Research Exchange, Thought Leadership Platform",
  topic:
    "Energy Research, Sector Outlooks, Case Studies, White Papers, Technical Notes, Knowledge Briefs",
  audience:
    "Industry professionals, researchers, academics, policymakers, consultants, technology providers, startup founders",
  canonical: "https://www.energdive.com/energdive-insights-exchange",
  openGraph: {
    title: "ENERGDIVE Insights Exchange",
    description:
      "A curated ENERGClub-powered knowledge platform for research, practical insights, and industry perspectives on India's energy transition.",
    url: "https://www.energdive.com/energdive-insights-exchange",
    siteName: "ENERGDIVE",
  },
  twitter: {
    title: "ENERGDIVE Insights Exchange",
    description:
      "Research papers, sector outlooks, case studies, white papers, technical notes, and knowledge briefs for India's energy ecosystem.",
    site: "@energdive",
  },
});

export const ENERGCLUB_PAGE_METADATA = buildExactPageMetadata({
  title: "ENERGClub | India's Energy Network, Community & Industry Platform",
  description:
    "Join ENERGClub, India's exclusive energy network connecting industry leaders, policymakers, and innovators across oil & gas, power, renewables, and sustainability to drive collaboration and intelligence.",
  keywords:
    "energclub, energ club, energclub india, energclub community, energclub membership, energclub login, energclub subscription, energclub energy network, energy network india, energy community india, energy leadership network india, energy industry community india, energy professionals network india, energy collaboration platform india, energy innovation network india, energy policy network india, energy transition community india, energy club india, energy club energdive",
  author: "ClariSector Technologies Pvt. Ltd.",
  publisher: "ENERGClub/ENERGDIVE",
  generator: "ClariSector Technologies Pvt. Ltd.",
  classification: "Energy Community Platform, Industry Network, Energy Ecosystem Platform",
  topic:
    "Energy Network, Community, Membership, Collaboration, Oil & Gas, Power, Renewables, Sustainability",
  audience:
    "Energy professionals, policymakers, corporates, innovators, investors, industry leaders",
  canonical: "https://www.energdive.com/energclub",
  openGraph: {
    title: "ENERGClub | India's Energy Network & Community Platform",
    description:
      "Join ENERGClub — an exclusive energy ecosystem connecting leaders, policymakers, and innovators shaping India's energy future.",
    url: "https://www.energdive.com/energclub",
    siteName: "ENERGClub",
  },
  twitter: {
    title: "ENERGClub | India's Energy Community & Network",
    description:
      "Connect with industry leaders, policymakers, and innovators through ENERGClub — India's premier energy ecosystem platform.",
    site: "@energdive",
  },
});

export const SECTORS_PAGE_METADATA = buildExactPageMetadata({
  title:
    "Energy Sectors in India | Insights, Analysis & Industry Coverage | ENERGDIVE",
  description:
    "Explore energy sectors in India with in-depth insights, analysis and industry coverage across power, oil & gas, renewables, hydrogen and emerging energy domains.",
  keywords:
    "energy sectors india, energy industry, energy sector analysis, energy industry insights, energy industry overview, energy sector coverage, india energy ecosystem, energy sectors, energy industry, energy insights, energy market analysis",
  author: "ClariSector Technologies Pvt. Ltd.",
  publisher: "ENERGDIVE",
  generator: "ClariSector Technologies Pvt. Ltd.",
  classification:
    "Energy Intelligence Platform, Energy Sectors Portal, Energy Industry Knowledge Platform",
  topic:
    "Energy Sectors, Oil & Gas, Power, Renewables, Energy Markets, Storage, Sustainability, New Energies",
  audience:
    "Energy professionals, policymakers, corporates, investors, utilities, researchers, industry leaders",
  canonical: "https://www.energdive.com/sectors",
  openGraph: {
    title: "Energy Sectors India | ENERGDIVE",
    description:
      "Discover insights across India's energy sectors including oil & gas, power, renewables, markets, storage, sustainability and emerging technologies.",
    url: "https://www.energdive.com/sectors",
    siteName: "ENERGDIVE",
  },
  twitter: {
    title: "Energy Sectors India | ENERGDIVE",
    description:
      "Explore oil & gas, power, renewables, markets, storage and sustainability insights shaping India's energy ecosystem.",
    site: "@energdive",
  },
});

const SECTOR_PAGE_METADATA_BY_SLUG: Record<string, Metadata> = {
  "oil-gas": buildExactPageMetadata({
    title:
      "Oil & Gas Industry in India | Insights, Analysis & Sector Coverage | ENERGDIVE",
    description:
      "Explore oil & gas intelligence from ENERGDIVE covering upstream, pipelines, refining, petrochemicals, CGD, LPG, retail and oil markets with insights on policy, infrastructure, technology, and market developments shaping India's energy future.",
    keywords:
      "oil and gas industry analysis, oil & gas industry india, oil & gas sector india, oil and gas industry insights, oil & gas industry analysis, oil & gas sector coverage, oil and gas market research, industry insights for natural gas sector in india, lpg industry insights, lpg market analysis india, oil market insights india, crude oil market analysis india, coal to gas",
    author: "ClariSector Technologies Pvt. Ltd.",
    publisher: "ENERGDIVE",
    generator: "ClariSector Technologies Pvt. Ltd.",
    classification:
      "Oil & Gas Intelligence Platform, Energy Sector Platform, Industry Insights Portal",
    topic:
      "Oil & Gas, Upstream, Refining, Pipelines, Petrochemicals, CGD, LPG, Energy Markets",
    audience:
      "Oil & gas professionals, policymakers, energy companies, investors, analysts, industry leaders",
    canonical: "https://www.energdive.com/sectors/oil-gas",
    openGraph: {
      title: "Oil & Gas Industry India | ENERGDIVE",
      description:
        "Get insights on India's oil & gas sector including upstream, refining, pipelines, petrochemicals and energy markets shaping the industry's future.",
      url: "https://www.energdive.com/sectors/oil-gas",
      siteName: "ENERGDIVE",
    },
    twitter: {
      title: "Oil & Gas Industry India | ENERGDIVE",
      description:
        "Explore insights on oil & gas markets, infrastructure, and policy shaping India's energy ecosystem.",
      site: "@energdive",
    },
  }),
  "power-generation": buildExactPageMetadata({
    title:
      "Power Generation Industry in India | Insights, Analysis & Sector Coverage | ENERGDIVE",
    description:
      "Explore India's power generation industry with expert insights, power industry analysis and sector-focused coverage across thermal power, nuclear energy, utilities and electricity generation trends.",
    keywords:
      "power generation industry in india, power sector analysis in india, electricity generation in india, power industry insights, power generation industry analysis, power generation industry outlook, nuclear power industry analysis, thermal power industry insights, power industry analysis, power market analysis, electricity market analysis, power industry overview",
    author: "ClariSector Technologies Pvt. Ltd.",
    publisher: "ENERGDIVE",
    generator: "ClariSector Technologies Pvt. Ltd.",
    classification:
      "Power Sector Intelligence Platform, Energy Utilities Platform, Electricity Industry Portal",
    topic:
      "Power Generation, Thermal Power, Nuclear Power, Utilities, Electricity, Grid, Energy Transition",
    audience:
      "Power sector professionals, utilities, policymakers, energy companies, investors, analysts",
    canonical: "https://www.energdive.com/sectors/power-generation",
    openGraph: {
      title: "Power Generation India | ENERGDIVE",
      description:
        "Explore insights on India's power generation sector including thermal, nuclear, utilities, grid innovation, and energy transition.",
      url: "https://www.energdive.com/sectors/power-generation",
      siteName: "ENERGDIVE",
    },
    twitter: {
      title: "Power Generation India | ENERGDIVE",
      description:
        "Track thermal, nuclear, and utilities sector developments shaping India's electricity and power ecosystem.",
      site: "@energdive",
    },
  }),
  renewables: buildExactPageMetadata({
    title:
      "Renewable Energy Industry in India | Insights, Analysis & Sector Coverage | ENERGDIVE",
    description:
      "Explore India's renewable energy industry with expert insights, market analysis and sector-focused coverage across solar, wind, hydro and biopower technologies.",
    keywords:
      "renewable sector in india, renewable energy industry india, renewable energy sector india, renewable power market analysis, renewable energy trends india, renewable energy industry outlook, solar energy industry insights, wind energy industry analysis, hydro power industry insights, biopower industry analysis, solar power market analysis, waste to energy market analysis, wind power market insights, solar power india",
    author: "ClariSector Technologies Pvt. Ltd.",
    publisher: "ENERGDIVE",
    generator: "ClariSector Technologies Pvt. Ltd.",
    classification:
      "Renewable Energy Platform, Clean Energy Intelligence Platform, Energy Transition Portal",
    topic:
      "Renewable Energy, Solar, Wind, Hydro, Bioenergy, Clean Energy, Sustainability, Energy Transition",
    audience:
      "Renewable energy professionals, policymakers, investors, developers, utilities, industry leaders",
    canonical: "https://www.energdive.com/sectors/renewables",
    openGraph: {
      title: "Renewable Energy India | ENERGDIVE",
      description:
        "Track India's renewable energy growth across solar, wind, hydro, and bioenergy with insights on policy, investments, and market developments.",
      url: "https://www.energdive.com/sectors/renewables",
      siteName: "ENERGDIVE",
    },
    twitter: {
      title: "Renewable Energy India | ENERGDIVE",
      description:
        "Explore solar, wind, hydro, and bioenergy insights shaping India's renewable energy transition.",
      site: "@energdive",
    },
  }),
  transmission: buildExactPageMetadata({
    title:
      "Power Transmission Industry in India | Insights, Analysis & Grid Coverage | ENERGDIVE",
    description:
      "Expert insights and industry analysis on India's power transmission sector covering smart grids, transmission infrastructure, digital utilities and grid modernization.",
    keywords:
      "power transmission industry, power transmission industry overview, power transmission industry outlook, smart grid industry india, smart grid industry analysis, transmission sector india, digital power grid transformation india, transmission sector outlook india, smart grid india, power transmission and distribution",
    author: "ClariSector Technologies Pvt. Ltd.",
    publisher: "ENERGDIVE",
    generator: "ClariSector Technologies Pvt. Ltd.",
    classification:
      "Power Transmission Platform, Grid Infrastructure Intelligence Platform, Energy Network Portal",
    topic:
      "Power Transmission, Smart Grid, Grid Infrastructure, Interconnections, Electricity Networks, Energy Transition",
    audience:
      "Power utilities, transmission companies, policymakers, grid operators, energy professionals, investors",
    canonical: "https://www.energdive.com/sectors/transmission",
    openGraph: {
      title: "Power Transmission India | ENERGDIVE",
      description:
        "Track grid expansion, smart grid technologies, and transmission infrastructure shaping India's evolving power system.",
      url: "https://www.energdive.com/sectors/transmission",
      siteName: "ENERGDIVE",
    },
    twitter: {
      title: "Power Transmission India | ENERGDIVE",
      description:
        "Explore transmission networks, smart grids, and infrastructure driving India's power system transformation.",
      site: "@energdive",
    },
  }),
  distribution: buildExactPageMetadata({
    title:
      "Power Distribution Industry in India | Insights, Analysis & Utility Coverage | ENERGDIVE",
    description:
      "Expert insights and industry analysis on India's power distribution sector covering smart meters, AMI, EV charging, smart cities and digital utility transformation.",
    keywords:
      "power distribution india, power distribution industry, distribution sector, electric power distribution, power distribution analysis, smart meter industry insights, ami infrastructure india, ev charging market analysis, ev energy ecosystem, data center utility analysis, data centre power distribution, power transmission and distribution",
    author: "ClariSector Technologies Pvt. Ltd.",
    publisher: "ENERGDIVE",
    generator: "ClariSector Technologies Pvt. Ltd.",
    classification:
      "Power Distribution Platform, Utility Intelligence Platform, Energy Infrastructure Portal",
    topic:
      "Power Distribution, Smart Meters, EV Charging, Utilities, Digital Infrastructure, Smart Cities, Electricity Consumers",
    audience:
      "Utilities, discoms, policymakers, energy professionals, infrastructure companies, investors",
    canonical: "https://www.energdive.com/sectors/distribution",
    openGraph: {
      title: "Power Distribution India | ENERGDIVE",
      description:
        "Track smart meters, EV charging, and digital utilities transforming India's power distribution and consumer energy ecosystem.",
      url: "https://www.energdive.com/sectors/distribution",
      siteName: "ENERGDIVE",
    },
    twitter: {
      title: "Power Distribution India | ENERGDIVE",
      description:
        "Explore smart metering, EV charging, and digital infrastructure shaping India's power distribution sector.",
      site: "@energdive",
    },
  }),
  "electricity-markets": buildExactPageMetadata({
    title:
      "Electricity Markets in India | Insights, Analysis & Market Coverage | ENERGDIVE",
    description:
      "India's electricity markets are evolving through power trading, carbon markets and regulatory transformation shaping the future of energy economics and market participation.",
    keywords:
      "electricity markets in india, electricity market analysis, power market insights, carbon market outlook, electricity market reforms, renewable compliance market, carbon credit market analysis, electricity market liberalization, power markets analysis",
    author: "ClariSector Technologies Pvt. Ltd.",
    publisher: "ENERGDIVE",
    generator: "ClariSector Technologies Pvt. Ltd.",
    classification:
      "Electricity Market Intelligence Platform, Energy Trading Platform, Power Market Insights Portal",
    topic:
      "Electricity Markets, Power Trading, Carbon Markets, Energy Pricing, Electricity Regulation, Energy Exchanges",
    audience:
      "Energy traders, utilities, policymakers, regulators, power companies, investors, analysts",
    canonical: "https://www.energdive.com/sectors/electricity-markets",
    openGraph: {
      title: "Electricity Markets India | ENERGDIVE",
      description:
        "Understand power trading, carbon markets, and electricity pricing trends shaping India's evolving energy markets.",
      url: "https://www.energdive.com/sectors/electricity-markets",
      siteName: "ENERGDIVE",
    },
    twitter: {
      title: "Electricity Markets India | ENERGDIVE",
      description:
        "Explore power trading, carbon markets, and pricing dynamics shaping India's electricity markets.",
      site: "@energdive",
    },
  }),
  "new-energies": buildExactPageMetadata({
    title:
      "New Energies in India | Hydrogen, E-Fuels & Future Energy Insights | ENERGDIVE",
    description:
      "India's new energies ecosystem is accelerating through green hydrogen, e-fuels and low-carbon fuel innovation driving the future of clean energy and industrial decarbonisation.",
    keywords:
      "hydrogen market analysis, green hydrogen insights, green hydrogen market, clean fuel technologies, e-fuel industry outlook, clean energy india, clean energy industry india, hydrogen economy analysis, hydrogen industry outlook",
    author: "ClariSector Technologies Pvt. Ltd.",
    publisher: "ENERGDIVE",
    generator: "ClariSector Technologies Pvt. Ltd.",
    classification:
      "New Energy Platform, Clean Technology Intelligence Platform, Energy Transition Innovation Portal",
    topic:
      "New Energies, Green Hydrogen, E-Fuels, Low Carbon Technologies, Energy Innovation, Decarbonisation",
    audience:
      "Energy innovators, policymakers, hydrogen industry, investors, technology providers, industry leaders",
    canonical: "https://www.energdive.com/sectors/new-energies",
    openGraph: {
      title: "New Energy India | ENERGDIVE",
      description:
        "Track green hydrogen, e-fuels, and emerging low-carbon technologies shaping India's next phase of energy transition.",
      url: "https://www.energdive.com/sectors/new-energies",
      siteName: "ENERGDIVE",
    },
    twitter: {
      title: "New Energy India | ENERGDIVE",
      description:
        "Explore hydrogen, e-fuels, and emerging technologies driving India's clean energy future.",
      site: "@energdive",
    },
  }),
  "energy-storage": buildExactPageMetadata({
    title:
      "Energy Storage in India | BESS, Pumped Hydro & Storage Insights | ENERGDIVE",
    description:
      "India's energy storage sector is accelerating through battery energy storage systems, pumped hydro and grid-scale storage technologies enabling a more flexible and resilient energy ecosystem.",
    keywords:
      "energy storage india, energy storage market insights, battery energy storage system analysis, bess india, pumped hydro storage, energy storage insights, bess market analysis, pumped hydro industry outlook, battery storage market analysis, bess industry insights, energy storage market analysis, energy storage insights, energy storage analysis, energy storage outlook, pumped hydropower market industry overview",
    author: "ClariSector Technologies Pvt. Ltd.",
    publisher: "ENERGDIVE",
    generator: "ClariSector Technologies Pvt. Ltd.",
    classification:
      "Energy Storage Platform, Grid Flexibility Intelligence Platform, Clean Energy Infrastructure Portal",
    topic:
      "Energy Storage, Battery Storage, Pumped Hydro, Grid Flexibility, Renewable Integration, Energy Systems",
    audience:
      "Energy storage companies, utilities, policymakers, investors, developers, technology providers",
    canonical: "https://www.energdive.com/sectors/energy-storage",
    openGraph: {
      title: "Energy Storage India | ENERGDIVE",
      description:
        "Track battery storage, pumped hydro, and long-duration energy storage solutions shaping India's grid flexibility and renewable integration.",
      url: "https://www.energdive.com/sectors/energy-storage",
      siteName: "ENERGDIVE",
    },
    twitter: {
      title: "Energy Storage India | ENERGDIVE",
      description:
        "Explore battery storage, pumped hydro, and grid flexibility technologies enabling India's renewable energy transition.",
      site: "@energdive",
    },
  }),
  "sustainability-and-safety": buildExactPageMetadata({
    title:
      "Sustainability & Safety Sector | Environment, HSE & Industry Analysis | ENERGDIVE",
    description:
      "Expert insights and industry analysis on sustainability, energy efficiency, environmental management, industrial safety, process safety and occupational health transformation.",
    keywords:
      "industrial safety analysis, hse industry insights, operational safety insights, process safety analysis, environmental compliance insights, process hazard analysis, industrial and process safety analysis, hse risk analysis, safety and sustainability analysis, environment health and safety policy, occupational health and safety industry, esg",
    author: "ClariSector Technologies Pvt. Ltd.",
    publisher: "ENERGDIVE",
    generator: "ClariSector Technologies Pvt. Ltd.",
    classification:
      "Sustainability Platform, Safety & HSE Intelligence Platform, Energy Compliance Portal",
    topic:
      "Sustainability, Safety, HSE, Energy Efficiency, Environment, Occupational Health, Industrial Safety",
    audience:
      "Energy companies, HSE professionals, policymakers, compliance officers, industry leaders, consultants",
    canonical: "https://www.energdive.com/sectors/sustainability-and-safety",
    openGraph: {
      title: "Sustainability & Safety in Energy India | ENERGDIVE",
      description:
        "Explore energy sustainability, HSE practices, and safety innovations shaping responsible and resilient energy systems in India.",
      url: "https://www.energdive.com/sectors/sustainability-and-safety",
      siteName: "ENERGDIVE",
    },
    twitter: {
      title: "Sustainability & Safety in Energy India | ENERGDIVE",
      description:
        "Discover insights on energy sustainability, industrial safety, and HSE practices shaping India's energy ecosystem.",
      site: "@energdive",
    },
  }),
};

export function getSectorPageMetadata(slug: string): Metadata {
  const pageMetadata = SECTOR_PAGE_METADATA_BY_SLUG[slug];
  if (pageMetadata) {
    return pageMetadata;
  }

  const formattedTitle = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: {
      absolute: `${formattedTitle} | ENERGDIVE`,
    },
    description: `Insights and intelligence for the ${formattedTitle} sector in India's energy transition.`,
    alternates: {
      canonical: `https://www.energdive.com/sectors/${slug}`,
    },
    openGraph: {
      title: `${formattedTitle} | ENERGDIVE`,
      description: `Insights and intelligence for the ${formattedTitle} sector in India's energy transition.`,
      url: `https://www.energdive.com/sectors/${slug}`,
      type: "website",
    },
  };
}
