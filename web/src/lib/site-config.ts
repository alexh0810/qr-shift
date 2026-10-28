const bookingUrl = process.env.NEXT_PUBLIC_DEMO_BOOKING_URL?.trim();
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();

export const siteConfig = {
  DEMO_BOOKING_URL: bookingUrl || "https://calendly.com/your-handle",
  CONTACT_EMAIL: contactEmail
    ? `mailto:${contactEmail}?subject=QRShift%20Inquiry`
    : "mailto:youremail@gmail.com?subject=QRShift%20Inquiry",
  INTERNAL_DEMO_PATH: "/admin",
} as const;
