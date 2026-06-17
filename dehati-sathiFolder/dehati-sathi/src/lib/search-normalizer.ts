const STOP_WORDS = new Set([
  "mujhe", "muje", "mze", "hame", "hamko", "chahiye", "chaiye", "chaahiye", "do",
  "dena", "dijiye", "dikhao", "dikhaiye", "bhejo", "wala", "wali", "wale", "ka",
  "ki", "ke", "hai", "hain", "please", "plz", "search", "find", "show", "need",
  "want", "for", "near", "nearby", "fresh", "sasta", "sasti", "saste", "accha",
  "achha", "best", "rate", "price", "bhav", "भाव", "दिखाओ", "चाहिए", "मुझे",
  "हमको", "देना", "वाला", "वाली", "ताजा", "सस्ता", "अच्छा", "पास"
]);

const PRODUCT_ALIASES: Record<string, string[]> = {
  tomato: ["tomato", "tamatar", "tamater", "टमाटर"],
  potato: ["potato", "aloo", "alu", "आलू"],
  onion: ["onion", "pyaz", "pyaaz", "प्याज"],
  garlic: ["garlic", "lahsun", "lehsun", "लहसुन"],
  ginger: ["ginger", "adrak", "अदरक"],
  chilli: ["chilli", "mirchi", "hari mirch", "मिर्च", "हरी मिर्च"],
  coriander: ["coriander", "dhaniya", "धनिया"],
  cauliflower: ["cauliflower", "gobhi", "gobi", "फूलगोभी", "गोभी"],
  cabbage: ["cabbage", "patta gobhi", "पत्ता गोभी"],
  okra: ["okra", "bhindi", "भिंडी"],
  brinjal: ["brinjal", "baingan", "eggplant", "बैंगन"],
  peas: ["peas", "matar", "मटर"],
  carrot: ["carrot", "gajar", "गाजर"],
  radish: ["radish", "mooli", "मूली"],
  spinach: ["spinach", "palak", "पालक"],
  bottle_gourd: ["bottle gourd", "lauki", "लौकी"],
  bitter_gourd: ["bitter gourd", "karela", "करेला"],
  pumpkin: ["pumpkin", "kaddu", "कद्दू"],
  cucumber: ["cucumber", "kheera", "खीरा"],
  banana: ["banana", "kela", "केला"],
  apple: ["apple", "seb", "सेब"],
  mango: ["mango", "aam", "आम"],
  guava: ["guava", "amrud", "अमरूद"],
  milk: ["milk", "doodh", "दूध"],
  curd: ["curd", "dahi", "दही"],
  paneer: ["paneer", "पनीर"],
  rice: ["rice", "chawal", "चावल"],
  wheat: ["wheat", "gehu", "गेहूं", "गेहूँ"],
  flour: ["flour", "atta", "आटा"],
  dal: ["dal", "daal", "lentil", "दाल"],
  oil: ["oil", "tel", "तेल"],
  salt: ["salt", "namak", "नमक"],
  sugar: ["sugar", "chini", "चीनी"],
  tea: ["tea", "chai", "चाय"],
  book: ["book", "kitab", "kitaab", "पुस्तक", "किताब"],
  notes: ["notes", "notebook", "copy", "कॉपी", "नोट्स"],
  pen: ["pen", "पेन"],
  pencil: ["pencil", "पेन्सिल", "पेंसिल"]
};

export function getSearchVariants(input: string) {
  const cleaned = input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = cleaned.split(" ").filter((word) => word.length > 1 && !STOP_WORDS.has(word));
  const variants = new Set<string>();

  if (cleaned) variants.add(cleaned);
  tokens.forEach((token) => variants.add(token));

  for (const aliases of Object.values(PRODUCT_ALIASES)) {
    if (aliases.some((alias) => cleaned.includes(alias.toLowerCase()))) {
      aliases.forEach((alias) => variants.add(alias.toLowerCase()));
    }
  }

  return Array.from(variants).slice(0, 18);
}

export function getBestSearchQuery(input: string) {
  const variants = getSearchVariants(input);
  return variants.find((term) => term.split(" ").length <= 2 && !STOP_WORDS.has(term)) || input;
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
