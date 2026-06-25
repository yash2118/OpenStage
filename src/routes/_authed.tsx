import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authed")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    let parsed: { user?: unknown; onboarding?: unknown } = {};
    try {
      const raw = localStorage.getItem("osg:v1");
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      parsed = {};
    }
    if (!parsed.user) throw redirect({ to: "/auth" });
    if (!parsed.onboarding) throw redirect({ to: "/onboarding" });
  },
  component: AppShell,
});