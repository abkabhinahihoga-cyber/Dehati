type SendOtpInput = {
  to: string;
  code: string;
};

function isDevOtpMode() {
  return process.env.WHATSAPP_OTP_DEV_MODE === "true" || process.env.NODE_ENV !== "production";
}

export async function sendWhatsappOtp({ to, code }: SendOtpInput) {
  const microserviceUrl = process.env.WHATSAPP_MICROSERVICE_URL || "http://localhost:3001";

  try {
    const response = await fetch(`${microserviceUrl}/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": "true",
      },
      body: JSON.stringify({ to, code }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("WhatsApp Microservice returned an error:", errorData);
      
      if (isDevOtpMode()) {
         console.info(`[DEV OTP FALLBACK] WhatsApp OTP for ${to}: ${code}`);
         return { provider: "dev-console", error: errorData };
      }
      
      throw new Error("Failed to send WhatsApp message via Microservice");
    }

    const payload = await response.json();
    console.log("WhatsApp message sent successfully via microservice:", payload);
    return payload;

  } catch (error) {
    console.error("Error communicating with WhatsApp Microservice:", error);
    
    if (isDevOtpMode()) {
       console.info(`[DEV OTP FALLBACK] WhatsApp OTP for ${to}: ${code}`);
       return { provider: "dev-console" };
    }
    
    throw new Error("Unable to reach WhatsApp Microservice.");
  }
}
