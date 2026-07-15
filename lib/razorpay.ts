import Razorpay from "razorpay";

// ---------------------------------------------------------------------------
// Singleton Razorpay instance (server-side only)
// ---------------------------------------------------------------------------
// Reads RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from process.env.
// Throws a descriptive error if either is missing.
// Never import this file from client components.
// ---------------------------------------------------------------------------

const globalForRazorpay = globalThis as unknown as {
  razorpay: Razorpay | undefined;
};

function createRazorpayInstance(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId) {
    throw new Error(
      "[Razorpay] Missing RAZORPAY_KEY_ID environment variable. " +
        "Add it to .env.local (test mode: rzp_test_…)"
    );
  }

  if (!keySecret) {
    throw new Error(
      "[Razorpay] Missing RAZORPAY_KEY_SECRET environment variable. " +
        "Add it to .env.local."
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Returns the singleton Razorpay instance.
 * Cached on `globalThis` in development to survive hot-reloads.
 */
export function getRazorpay(): Razorpay {
  const instance = globalForRazorpay.razorpay ?? createRazorpayInstance();

  if (process.env.NODE_ENV !== "production") {
    globalForRazorpay.razorpay = instance;
  }

  return instance;
}

/**
 * Returns the public Razorpay Key ID (safe to send to the frontend).
 * Never returns the secret.
 */
export function getRazorpayKeyId(): string {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new Error("[Razorpay] Missing RAZORPAY_KEY_ID environment variable.");
  }
  return keyId;
}
