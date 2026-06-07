export type NormalizedPhone = {
  mobile: string;
  countryCode: string;
  e164: string;
  whatsappTo: string;
};

const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || "91";

export function normalizeIndianMobile(input: string): NormalizedPhone {
  const digits = String(input || "").replace(/\D/g, "");
  const withoutLeadingZeros = digits.replace(/^0+/, "");
  const countryCode = DEFAULT_COUNTRY_CODE.replace(/\D/g, "") || "91";

  let mobile = withoutLeadingZeros;

  if (withoutLeadingZeros.startsWith(countryCode) && withoutLeadingZeros.length === countryCode.length + 10) {
    mobile = withoutLeadingZeros.slice(countryCode.length);
  }

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    throw new Error("Enter a valid 10 digit Indian mobile number");
  }

  return {
    mobile,
    countryCode,
    e164: `+${countryCode}${mobile}`,
    whatsappTo: `${countryCode}${mobile}`,
  };
}
