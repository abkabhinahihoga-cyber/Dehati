export const SELLER_GROCERY_CATEGORIES = [
    "Fresh Vegetables",
    "Fresh Fruits",
    "Rice, Atta & Dals",
    "Live Plants",
    "HandCrafted",
    "Others"
] as const;

export const HUB_GROCERY_CATEGORIES = [
    "Dairy & Breakfast",
    "Spices & Masalas",
    "Snacks & Packaged Food",
    "Household Essentials",
    "Personal Care",
    "Cold Drinks & Juices",
    "Chocolates & Ice Cream"
] as const;

export const GROCERY_CATEGORIES = [...SELLER_GROCERY_CATEGORIES, ...HUB_GROCERY_CATEGORIES] as const;

export const CATEGORY_HINDI_LABELS: Record<string, string> = {
    "Fresh Vegetables": "ताजी सब्जियां",
    "Fresh Fruits": "ताजे फल",
    "Rice, Atta & Dals": "चावल, आटा और दाल",
    "Live Plants": "जीवित पौधे",
    "HandCrafted": "हस्तनिर्मित सामान",
    "Others": "अन्य",
    "Dairy & Breakfast": "दूध, डेयरी और नाश्ता",
    "Spices & Masalas": "मसाले",
    "Snacks & Packaged Food": "स्नैक्स और पैक्ड फूड",
    "Household Essentials": "घरेलू जरूरतें",
    "Personal Care": "पर्सनल केयर",
    "Cold Drinks & Juices": "कोल्ड ड्रिंक और जूस",
    "Chocolates & Ice Cream": "चॉकलेट और आइसक्रीम",
};

export const CATEGORY_IMAGE_MAP: Record<string, string> = {
    "Fresh Vegetables": "/category-images/fresh-vegetables.jpeg",
    "Fresh Fruits": "/category-images/fresh-fruits.jpeg",
    "Rice, Atta & Dals": "/category-images/rice-atta-dal.jpeg",
    "Live Plants": "/category-images/live-plants.jpeg",
    "HandCrafted": "/category-images/handcrafted.jpeg",
    "Others": "/category-images/others.jpeg",
    "Dairy & Breakfast": "/category-images/dairy-breakfast.jpeg",
    "Spices & Masalas": "/category-images/spices-masalas.jpeg",
    "Snacks & Packaged Food": "/category-images/snacks-packaged-food.jpeg",
    "Household Essentials": "/category-images/household-essentials.jpeg",
    "Personal Care": "/category-images/personal-care.jpeg",
    "Cold Drinks & Juices": "/category-images/cold-drinks-juices.jpeg",
    "Chocolates & Ice Cream": "/category-images/chocolates-ice-cream.jpeg",
};

export const CATEGORY_ALIASES: Record<string, string> = {
    "Vegetables": "Fresh Vegetables",
    "Fresh Vegetable": "Fresh Vegetables",
    "Fruits": "Fresh Fruits",
    "Fresh Fruit": "Fresh Fruits",
    "Dal": "Rice, Atta & Dals",
    "Dals": "Rice, Atta & Dals",
    "Rice": "Rice, Atta & Dals",
    "Wheat & Atta": "Rice, Atta & Dals",
    "Atta": "Rice, Atta & Dals",
    "Rice Atta and Rice": "Rice, Atta & Dals",
    "Rice Atta Dal": "Rice, Atta & Dals",
    "Handcrafted": "HandCrafted",
    "Hand Crafted": "HandCrafted",
    "Packed foods and snacks": "Snacks & Packaged Food",
    "Packed Foods & Snacks": "Snacks & Packaged Food",
    "Spices and Masala": "Spices & Masalas",
    "Chocklate and icecream": "Chocolates & Ice Cream",
    "Chocolate and Ice Cream": "Chocolates & Ice Cream",
    "Dairy and Milk": "Dairy & Breakfast",
};

export function normalizeCategory(category: string) {
    const trimmed = (category || "").trim();
    return CATEGORY_ALIASES[trimmed] || trimmed;
}

export function getCategoryLabel(category: string, locale?: string) {
    const normalized = normalizeCategory(category);
    return locale === "hi" ? CATEGORY_HINDI_LABELS[normalized] || normalized : normalized;
}

export function getCategoryImage(category: string) {
    return CATEGORY_IMAGE_MAP[normalizeCategory(category)] || CATEGORY_IMAGE_MAP["Others"];
}

export const BOOK_CATEGORIES = [
    "LKG & UKG",
    "Class 1 - 5",
    "Class 6 - 8",
    "Class 9 & 11",
    "Class 10 & 12 (Board)",
    "Entrance Exam (JEE/NEET)",
    "Graduation (B.Tech/B.Sc/BA)",
    "Novels & Fiction",
    "Notes & Study Material",
    "Stationary",
    "Others"
] as const;

export const ALL_CATEGORIES = [...GROCERY_CATEGORIES, ...BOOK_CATEGORIES] as const;
