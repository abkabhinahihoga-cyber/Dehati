import redis from "@/lib/redis";
import { sendWhatsappOtp } from "@/lib/whatsapp";
import { NormalizedPhone } from "@/lib/phone";
import crypto from "crypto";

// ── TTLs & limits ────────────────────────────────────────────────────────────
const OTP_TTL = 5 * 60;           // 5 min – OTP lives this long
const COOLDOWN_TTL = 60;          // 60 s  – min gap between requests per mobile
const SESSION_TTL = 10 * 60;      // 10 min – one-time session token for signIn
const MAX_ATTEMPTS = 5;           // max wrong guesses before lockout
const IP_LIMIT = 5;               // max OTP sends per IP per minute

// ── Redis key helpers ─────────────────────────────────────────────────────────
const keys = {
  otp:      (m: string) => `otp:v:${m}`,
  attempts: (m: string) => `otp:att:${m}`,
  cooldown: (m: string) => `otp:cd:${m}`,
  ipRate:   (ip: string) => `otp:ip:${ip}`,
  session:  (t: string) => `otp:sess:${t}`,
};

// ── OTP generator ─────────────────────────────────────────────────────────────
function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Send OTP ─────────────────────────────────────────────────────────────────
export async function requestWhatsappOtp({
  phone,
  ip,
}: {
  phone: NormalizedPhone;
  ip: string;
}) {
  // 1. IP rate limit (5 sends / minute / IP)
  const ipKey = keys.ipRate(ip);
  const ipCount = await redis.incr(ipKey);
  if (ipCount === 1) await redis.expire(ipKey, 60);
  if (ipCount > IP_LIMIT) {
    throw new Error("Too many OTP requests. Please wait a minute and try again.");
  }

  // 2. Per-mobile cooldown (1 OTP per 60 s)
  const cdKey = keys.cooldown(phone.mobile);
  const onCooldown = await redis.get(cdKey);
  if (onCooldown) {
    const ttl = await redis.ttl(cdKey);
    throw new Error(`Please wait ${ttl} second${ttl !== 1 ? "s" : ""} before requesting a new OTP.`);
  }

  // 3. Generate & store
  const code = genOtp();
  await redis.setex(keys.otp(phone.mobile), OTP_TTL, code);
  await redis.del(keys.attempts(phone.mobile));
  await redis.setex(cdKey, COOLDOWN_TTL, "1");

  // 4. Dispatch via WhatsApp (or dev-console in dev mode)
  const sendResult = await sendWhatsappOtp({ to: phone.whatsappTo, code });

  return {
    devOtp: process.env.NODE_ENV !== "production" ? code : undefined,
    ...sendResult,
  };
}

// ── Verify OTP (throws on failure) ───────────────────────────────────────────
export async function verifyOtp({
  mobile,
  code,
}: {
  mobile: string;
  code: string;
}) {
  const vKey = keys.otp(mobile);
  const aKey = keys.attempts(mobile);

  // Brute-force guard
  const attempts = parseInt((await redis.get(aKey)) || "0");
  if (attempts >= MAX_ATTEMPTS) {
    throw new Error("Too many failed attempts. Please request a new OTP.");
  }

  const stored = await redis.get(vKey);
  if (!stored) {
    throw new Error("OTP expired or not found. Please request a new OTP.");
  }

  if (stored !== code) {
    const newAttempts = await redis.incr(aKey);
    await redis.expire(aKey, OTP_TTL);
    const remaining = MAX_ATTEMPTS - newAttempts;
    throw new Error(
      remaining > 0
        ? `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
        : "Too many failed attempts. Please request a new OTP."
    );
  }

  // ✅ Correct – remove OTP & attempts
  await redis.del(vKey);
  await redis.del(aKey);
}

// ── Session token (one-time, 10-min) ─────────────────────────────────────────
export async function generateOtpSessionToken(mobile: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await redis.setex(keys.session(token), SESSION_TTL, mobile);
  return token;
}

// Called by auth.ts authorize() – deletes token after first use
export async function consumeOtpSessionToken(
  token: string
): Promise<string | null> {
  const sKey = keys.session(token);
  const mobile = await redis.get(sKey);
  if (mobile) await redis.del(sKey); // one-time use
  return mobile ?? null;
}
