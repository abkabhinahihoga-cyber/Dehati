export function normalizeIndianMobile(input: string) {
  const digits = (input || "").replace(/\D/g, "");

  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return {
      national: digits,
      e164: `+91${digits}`,
      whatsapp: `91${digits}`,
    };
  }

  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) {
    const national = digits.slice(2);
    return {
      national,
      e164: `+91${national}`,
      whatsapp: digits,
    };
  }

  return null;
}
