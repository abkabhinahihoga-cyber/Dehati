import mongoose from "mongoose";

interface IDeliveryAssignment {
    _id?:mongoose.Types.ObjectId,
    order:mongoose.Types.ObjectId,
    brodcastedTo:mongoose.Types.ObjectId[],
    assignedTo:mongoose.Types.ObjectId | null,
    status:"brodcasted" | "assigned"  | "completed",
    acceptedAt:Date,
    createdAt?:Date,
    updatedAt?:Date
}

const deliveryAssignMentSchema=new mongoose.Schema<IDeliveryAssignment>({
    order:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Order"
    },
    brodcastedTo:[
        { 
             type:mongoose.Schema.Types.ObjectId,
        ref:"User"

        }
    ],
    assignedTo:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"

    },
    status:{
        type:String,
        enum:["brodcasted" , "assigned"  , "completed"],
        default:"brodcasted"
    },
    acceptedAt:{
        type:Date
    }
},{timestamps:true})

const DeliveryAssignment=mongoose.models.DeliveryAssignment || mongoose.model("DeliveryAssignment",deliveryAssignMentSchema)
export default DeliveryAssignment