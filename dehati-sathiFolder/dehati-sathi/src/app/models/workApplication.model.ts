import mongoose from 'mongoose';

const workApplicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workOpportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOpportunity', required: true },
    
    // Application Form Details
    fullName: { type: String },
    mobileNumber: { type: String },
    village: { type: String },
    district: { type: String },
    state: { type: String },
    age: { type: Number },
    gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    occupation: { type: String },
    experience: { type: String },
    workingHoursPerDay: { type: Number },
    familyMembersInterested: { type: Number, default: 1 },
    aadhaarUrl: { type: String }, // Saved during application process
    
    // Status
    status: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Rejected', 'Material Assigned', 'Work Started', 'Submitted', 'Quality Check', 'Payment Released'],
        default: 'Pending'
    },
    
    // Work Tracking (populated after approval)
    assignedQuantity: { type: Number, default: 0 },
    completedQuantity: { type: Number, default: 0 },
    rejectedQuantity: { type: Number, default: 0 },
    earnedAmount: { type: Number, default: 0 },
    
    adminNotes: { type: String },
    
    // Dates
    appliedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    deadlineAt: { type: Date },
    completedAt: { type: Date }
}, { timestamps: true });

const WorkApplication = mongoose.models.WorkApplication || mongoose.model('WorkApplication', workApplicationSchema);
export default WorkApplication;
