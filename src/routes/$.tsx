import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/$")({
  head: () => ({ meta: [{ title: "Not found — OpenStage" }] }),
  component: NotFound,
});

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">404</div>
        <h1 className="mt-3 font-display font-bold text-3xl tracking-tight">
          Off the path.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That screen doesn't exist. Head back to Today and keep the streak alive.
        </p>
        <Link
          to="/today"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Back to Today
        </Link>
      </div>
    </div>
  );
}