// Default competition catalogue (API-Football league ids). Men's senior football only.
// Admins can enable/disable these or add more from the control panel.

export interface CompetitionSeed {
  id: number;
  slug: string;
  name: string;
  country: string;
  category: "domestic" | "uefa" | "fifa";
  type: "league" | "cup";
  isNational?: boolean;
  neutral?: boolean;
  priority: number;
}

export const DEFAULT_COMPETITIONS: CompetitionSeed[] = [
  // Top 15 domestic leagues
  { id: 39, slug: "premier-league", name: "Premier League", country: "England", category: "domestic", type: "league", priority: 1 },
  { id: 140, slug: "la-liga", name: "La Liga", country: "Spain", category: "domestic", type: "league", priority: 2 },
  { id: 135, slug: "serie-a", name: "Serie A", country: "Italy", category: "domestic", type: "league", priority: 3 },
  { id: 78, slug: "bundesliga", name: "Bundesliga", country: "Germany", category: "domestic", type: "league", priority: 4 },
  { id: 61, slug: "ligue-1", name: "Ligue 1", country: "France", category: "domestic", type: "league", priority: 5 },
  { id: 88, slug: "eredivisie", name: "Eredivisie", country: "Netherlands", category: "domestic", type: "league", priority: 6 },
  { id: 94, slug: "primeira-liga", name: "Primeira Liga", country: "Portugal", category: "domestic", type: "league", priority: 7 },
  { id: 144, slug: "belgian-pro-league", name: "Belgian Pro League", country: "Belgium", category: "domestic", type: "league", priority: 8 },
  { id: 203, slug: "super-lig", name: "Süper Lig", country: "Turkey", category: "domestic", type: "league", priority: 9 },
  { id: 40, slug: "championship", name: "Championship", country: "England", category: "domestic", type: "league", priority: 10 },
  { id: 179, slug: "scottish-premiership", name: "Scottish Premiership", country: "Scotland", category: "domestic", type: "league", priority: 11 },
  { id: 71, slug: "brasileirao", name: "Brasileirão Série A", country: "Brazil", category: "domestic", type: "league", priority: 12 },
  { id: 128, slug: "liga-profesional", name: "Liga Profesional", country: "Argentina", category: "domestic", type: "league", priority: 13 },
  { id: 253, slug: "mls", name: "Major League Soccer", country: "USA", category: "domestic", type: "league", priority: 14 },
  { id: 307, slug: "saudi-pro-league", name: "Saudi Pro League", country: "Saudi Arabia", category: "domestic", type: "league", priority: 15 },

  // UEFA
  { id: 2, slug: "champions-league", name: "UEFA Champions League", country: "Europe", category: "uefa", type: "cup", priority: 20 },
  { id: 3, slug: "europa-league", name: "UEFA Europa League", country: "Europe", category: "uefa", type: "cup", priority: 21 },
  { id: 848, slug: "conference-league", name: "UEFA Conference League", country: "Europe", category: "uefa", type: "cup", priority: 22 },
  { id: 531, slug: "uefa-super-cup", name: "UEFA Super Cup", country: "Europe", category: "uefa", type: "cup", neutral: true, priority: 23 },
  { id: 4, slug: "euro-championship", name: "UEFA European Championship", country: "Europe", category: "uefa", type: "cup", isNational: true, neutral: true, priority: 24 },
  { id: 960, slug: "euro-qualifiers", name: "UEFA Euro Qualifiers", country: "Europe", category: "uefa", type: "cup", isNational: true, priority: 25 },
  { id: 5, slug: "nations-league", name: "UEFA Nations League", country: "Europe", category: "uefa", type: "cup", isNational: true, priority: 26 },

  // FIFA & national teams
  { id: 1, slug: "world-cup", name: "FIFA World Cup", country: "World", category: "fifa", type: "cup", isNational: true, neutral: true, priority: 30 },
  { id: 32, slug: "wc-qualifiers-europe", name: "WC Qualifiers – Europe", country: "World", category: "fifa", type: "cup", isNational: true, priority: 31 },
  { id: 34, slug: "wc-qualifiers-south-america", name: "WC Qualifiers – South America", country: "World", category: "fifa", type: "cup", isNational: true, priority: 32 },
  { id: 29, slug: "wc-qualifiers-africa", name: "WC Qualifiers – Africa", country: "World", category: "fifa", type: "cup", isNational: true, priority: 33 },
  { id: 30, slug: "wc-qualifiers-asia", name: "WC Qualifiers – Asia", country: "World", category: "fifa", type: "cup", isNational: true, priority: 34 },
  { id: 31, slug: "wc-qualifiers-concacaf", name: "WC Qualifiers – CONCACAF", country: "World", category: "fifa", type: "cup", isNational: true, priority: 35 },
  { id: 15, slug: "club-world-cup", name: "FIFA Club World Cup", country: "World", category: "fifa", type: "cup", neutral: true, priority: 36 },
  { id: 9, slug: "copa-america", name: "Copa América", country: "World", category: "fifa", type: "cup", isNational: true, neutral: true, priority: 37 },
  { id: 6, slug: "africa-cup-of-nations", name: "Africa Cup of Nations", country: "World", category: "fifa", type: "cup", isNational: true, neutral: true, priority: 38 },
  { id: 7, slug: "asian-cup", name: "AFC Asian Cup", country: "World", category: "fifa", type: "cup", isNational: true, neutral: true, priority: 39 },
  { id: 22, slug: "gold-cup", name: "CONCACAF Gold Cup", country: "World", category: "fifa", type: "cup", isNational: true, neutral: true, priority: 40 },
  { id: 10, slug: "international-friendlies", name: "International Friendlies", country: "World", category: "fifa", type: "cup", isNational: true, priority: 41 },
];

/** Guard against women's / youth competitions sneaking in (e.g. added by an admin). */
export const EXCLUDED_NAME = /\b(women|womens|feminin|femenin|frauen|female|u-?1[5-9]|u-?2[0-3]|youth|junior|reserve|ii\b|b team|olympic)/i;
