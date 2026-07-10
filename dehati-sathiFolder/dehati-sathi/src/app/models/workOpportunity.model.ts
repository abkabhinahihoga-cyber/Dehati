import mongoose from 'mongoose';

const workOpportunitySchema = new mongoose.Schema({
    title: { type: String, required: true },
    titleHindi: { type: String, required: true },
    category: { type: String, required: true }, // e.g., 'Agarbatti Making', 'Tailoring'
    companyName: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    trustScore: { type: Number, default: 0, min: 0, max: 100 },
    workType: { type: String, enum: ['Home Based', 'Field Work', 'Factory'], default: 'Home Based' },
    location: { type: String }, // e.g., 'All Over India' or specific district
    
    // Requirements & Offerings
    rawMaterialProvided: { type: Boolean, default: false },
    trainingAvailable: { type: Boolean, default: false },
    skillLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Expert'], default: 'Beginner' },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
    
    // Earnings & Quantities
    estimatedTimePerPieceMinutes: { type: Number },
    paymentPerPiece: { type: Number, required: true },
    paymentUnit: { type: String, default: 'piece' },
    estimatedDailyIncome: { type: Number },
    estimatedMonthlyIncome: { type: Number },
    minimumQuantity: { type: Number, default: 1 },
    
    // Availability
    availablePositions: { type: Number },
    workAvailability: { type: String, enum: ['High Demand', 'Limited', 'Full'], default: 'High Demand' },
    isSeasonal: { type: Boolean, default: false },
    seasonMonths: [{ type: String }], // e.g., ['October', 'November'] for Diwali
    
    // Descriptions & Media
    productImages: [{ type: String }],
    description: { type: String },
    requiredSkills: [{ type: String }],
    whoCanApply: { type: String },
    requiredTools: [{ type: String }],
    
    // Training Materials
    trainingVideoUrl: { type: String },
    imageTutorials: [{ type: String }],
    stepByStepProcess: [{ type: String }],
    qualityGuidelines: { type: String },
    commonMistakes: [{ type: String }],
    
    // Pickup & Delivery
    pickupProcess: { type: String },
    nearestPickupCenter: { type: String }, // can be linked to Hub
    
    isActive: { type: Boolean, default: true },
    createdByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const WorkOpportunity = mongoose.models.WorkOpportunity || mongoose.model('WorkOpportunity', workOpportunitySchema);
export default WorkOpportunity;
