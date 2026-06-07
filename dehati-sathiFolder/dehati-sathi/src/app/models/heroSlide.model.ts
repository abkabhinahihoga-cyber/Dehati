import mongoose from "mongoose";

const heroSlideSchema = new mongoose.Schema({
  mode: { 
    type: String, 
    enum: ['grocery', 'student'], 
    default: 'grocery',
    required: true 
  },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  btnText: { type: String, default: "Shop Now" },
  btnUrl: { type: String, default: "/" }, // 👈 New Field
  bgImage: { type: String, required: true },
  iconName: { type: String, default: "Leaf" },
  order: { type: Number, default: 0 } // 👈 New Field for sorting
}, { timestamps: true });

const HeroSlide = mongoose.models.HeroSlide || mongoose.model("HeroSlide", heroSlideSchema);
export default HeroSlide;