import crypto from "crypto";
import User from "@/app/models/user.model";

export async function generateUniqueReferralCode() {
  let code = "";

  do {
    code = crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
  } while (await User.findOne({ referralCode: code }));

  return code;
}
