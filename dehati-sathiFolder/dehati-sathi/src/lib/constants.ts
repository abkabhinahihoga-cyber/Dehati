// 1. SELLER CATEGORIES (Farmers/Villagers - Non-GST/Raw Items)
export const SELLER_GROCERY_CATEGORIES = [
    "Fresh Vegetables",
    "Fresh Fruits",
    "Rice, Atta & Dals", 
    "Live Plants",
    "HandCrafted",
    "Others"
] as const;

// 2. HUB CATEGORIES (GST/Packaged Items ONLY)
// ❌ Removed Seller categories from here to keep it strict
export const HUB_GROCERY_CATEGORIES = [
    "Dairy & Breakfast",
    "Spices & Masalas",
    "Snacks & Packaged Food",
    "Household Essentials",
    "Personal Care",
    "Cold Drinks & Juices",
    "Chocolates & Ice Cream"
] as const;

// 3. MASTER LIST FOR UI (Slider/Feed sees BOTH)
export const GROCERY_CATEGORIES = [...SELLER_GROCERY_CATEGORIES, ...HUB_GROCERY_CATEGORIES];

// 4. STUDENT/BOOK CATEGORIES
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

// 5. ALL COMBINED (For Database Validation)
export const ALL_CATEGORIES = [...GROCERY_CATEGORIES, ...BOOK_CATEGORIES];