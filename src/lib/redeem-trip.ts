"use client";

import { supabaseBrowser } from "@/lib/supabase";
import { redeemResponseSchema } from "@/lib/trip-contracts";
import { requestTurnstileToken } from "@/lib/turnstile";

export async function redeemTrip(token: string) {
  const supabase = supabaseBrowser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user.is_anonymous) {
    if (session) await supabase.auth.signOut();
    const captchaToken = await requestTurnstileToken();
    const { error } = await supabase.auth.signInAnonymously({
      options: captchaToken ? { captchaToken } : undefined,
    });
    if (error) throw new Error("Trip unavailable");
  }

  const turnstileToken = await requestTurnstileToken();
  const { data, error } = await supabase.functions.invoke("redeem-trip-share", {
    body: { token, turnstileToken },
  });
  if (error) throw new Error("Trip unavailable");
  return redeemResponseSchema.parse(data);
}
