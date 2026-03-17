import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY || import.meta.env.VITE_POSTHOG_KEY || "";
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || import.meta.env.VITE_POSTHOG_HOST || "https://eu.i.posthog.com";

export function initAnalytics(): void {
  if (!POSTHOG_KEY) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    persistence: "memory",
    autocapture: false,
  });
}

export function trackEvent(event: string, properties?: Record<string, string | number | boolean>): void {
  if (!POSTHOG_KEY) return;
  posthog.capture(event, properties);
}
