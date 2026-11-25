export interface LiveSiteConfig {
  name: string;
  url: string;
  category: 'lifestyle' | 'tech_news' | 'gaming' | 'quiz_reference' | 'recipes' | 'finance';
  description: string;
  hasTcfConsent?: boolean;
}

export const LIVE_SITES_CATALOG: LiveSiteConfig[] = [
  {
    name: 'eatpicks.com',
    url: 'https://eatpicks.com/',
    category: 'lifestyle',
    description: 'Food & lifestyle blog with Prebid.js, GAM, and identity EID syncs',
  },
  {
    name: 'idrlabs.com',
    url: 'https://www.idrlabs.com/anti-hero/test.php',
    category: 'quiz_reference',
    description: 'Personality & psychological testing site running header bidding',
  },
  {
    name: 'recipetineats.com',
    url: 'https://www.recipetineats.com/easy-maple-sticky-glazed-ham/',
    category: 'recipes',
    description: 'High-traffic food recipe blog with multi-bidder auction setup',
  },
  {
    name: 'linuxhint.com',
    url: 'https://linuxhint.com/install-alpine-linux-vmware-workstation-17-pro-virtual-machine/',
    category: 'tech_news',
    description: 'Linux tutorials and guides with header bidding ad monetization',
  },
  {
    name: 'accuweather.com',
    url: 'https://www.accuweather.com/',
    category: 'lifestyle',
    description: 'Global weather forecasting portal with advanced Prebid & GAM setup',
    hasTcfConsent: true,
  },
  {
    name: 'trumpexcel.com',
    url: 'https://trumpexcel.com/excel-functions/',
    category: 'finance',
    description: 'Excel tutorial resources with display ad slots',
  },
  {
    name: 'macrumors.com',
    url: 'https://www.macrumors.com/',
    category: 'tech_news',
    description: 'Apple news and rumors portal running Prebid.js',
  },
  {
    name: 'fut.gg',
    url: 'https://www.fut.gg/players/150516-lukas-podolski/24-50482164/',
    category: 'gaming',
    description: 'Gaming database and community site with multi-bidder ads',
  },
  {
    name: 'biancazapatka.com',
    url: 'https://biancazapatka.com/en/bircher-muesli-recipe/',
    category: 'recipes',
    description: 'Bilingual vegan food blog with Prebid & CMP',
    hasTcfConsent: true,
  },
  {
    name: 'britannica.com',
    url: 'https://www.britannica.com/quiz/that-90s-quiz',
    category: 'quiz_reference',
    description: 'Encyclopedic quiz portal with comprehensive header bidding stack',
    hasTcfConsent: true,
  },
  {
    name: 'expressandstar.com',
    url: 'https://www.expressandstar.com/news/business/2024/01/10/wolverhampton-shop-to-have-its-licence-reviewed-after-being-caught-selling-single-cans-of-high-strength-alcohol-out-of-hours/?criteo=true',
    category: 'tech_news',
    description: 'UK regional news publisher with Criteo and Prebid integration',
    hasTcfConsent: true,
  },
  {
    name: 'voici.fr',
    url: 'https://www.voici.fr/',
    category: 'lifestyle',
    description: 'French celebrity news magazine with Prisma Media CMP & Prebid',
    hasTcfConsent: true,
  },
  {
    name: 'welingelichtekringen.nl',
    url: 'https://www.welingelichtekringen.nl/',
    category: 'tech_news',
    description: 'Dutch news and opinion website with European CMP and Prebid',
    hasTcfConsent: true,
  },
  {
    name: 'heise.de',
    url: 'https://www.heise.de/hintergrund/Die-Entwickler-des-Open-Source-Lautsprechers-Teufel-Mynd-im-Interview-10490607.html',
    category: 'tech_news',
    description: 'German tech portal article page with TCF v2 CMP and header bidding',
    hasTcfConsent: true,
  },
  {
    name: 'theguardian.com',
    url: 'https://www.theguardian.com/international',
    category: 'tech_news',
    description: 'UK global news publisher running Prebid.js with commercial bundle',
    hasTcfConsent: true,
  },
];
