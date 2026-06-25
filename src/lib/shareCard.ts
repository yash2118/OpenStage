import type { CheckIn, UserProfile } from "@/lib/store";

export type ShareCardInput = {
  user: UserProfile;
  checkIn?: CheckIn | null;
  streak: number;
  trustScore: number;
  weeklyDone: number;
  weeklyTarget: number;
  variant?: "checkin" | "passport";
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Renders a 1080x1350 (Instagram-friendly) share card to a canvas. */
export function renderShareCard(canvas: HTMLCanvasElement, input: ShareCardInput) {
  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0a0d12");
  bg.addColorStop(1, "#11161f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let y = 0; y < H; y += 32) {
    for (let x = 0; x < W; x += 32) {
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const accent = ctx.createLinearGradient(0, 0, W, 0);
  accent.addColorStop(0, "#d6ff3a");
  accent.addColorStop(1, "#ff7a4a");
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 8);

  ctx.fillStyle = "#d6ff3a";
  ctx.font = "600 28px ui-monospace, 'JetBrains Mono', monospace";
  ctx.fillText("OPENSTAGE", 72, 100);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 22px ui-monospace, monospace";
  ctx.fillText(input.variant === "passport" ? "GYM PASSPORT" : "CHECK-IN POSTED", 280, 100);

  const ax = 72;
  const ay = 160;
  const ar = 52;
  ctx.fillStyle = input.user.avatarColor;
  ctx.beginPath();
  ctx.arc(ax + ar, ay + ar, ar, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0a0d12";
  ctx.font = "800 44px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const initials = input.user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  ctx.fillText(initials, ax + ar, ay + ar + 2);
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 44px Inter, sans-serif";
  ctx.fillText(input.user.name, ax + ar * 2 + 24, ay + 50);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 24px Inter, sans-serif";
  ctx.fillText(`@${input.user.handle}`, ax + ar * 2 + 24, ay + 86);

  const heroY = 340;
  if (input.variant === "passport" || !input.checkIn) {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "600 28px ui-monospace, monospace";
    ctx.fillText("CONSISTENCY OVER PERFORMANCE", 72, heroY);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 96px Inter, sans-serif";
    ctx.fillText(`${input.streak}d`, 72, heroY + 110);
    ctx.fillStyle = "#d6ff3a";
    ctx.font = "700 36px Inter, sans-serif";
    ctx.fillText("current streak", 72, heroY + 156);
  } else {
    const c = input.checkIn;
    ctx.font = "120px sans-serif";
    ctx.fillText(c.proofEmoji, 72, heroY + 80);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "600 26px ui-monospace, monospace";
    ctx.fillText(c.activityType.toUpperCase(), 220, heroY + 30);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 64px Inter, sans-serif";
    const title = c.title.length > 24 ? c.title.slice(0, 23) + "…" : c.title;
    ctx.fillText(title, 220, heroY + 80);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "500 30px Inter, sans-serif";
    ctx.fillText(`${c.duration} min · RPE ${c.effort}`, 220, heroY + 124);
  }

  const sy = 760;
  const stats = [
    { label: "STREAK", value: `${input.streak}d` },
    { label: "TRUST", value: String(input.trustScore) },
    { label: "WEEK", value: `${input.weeklyDone}/${input.weeklyTarget}` },
  ];
  const colW = (W - 144 - 32 * 2) / 3;
  stats.forEach((s, i) => {
    const x = 72 + i * (colW + 32);
    ctx.fillStyle = "rgba(214,255,58,0.08)";
    roundRect(ctx, x, sy, colW, 180, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(214,255,58,0.18)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "600 22px ui-monospace, monospace";
    ctx.fillText(s.label, x + 24, sy + 44);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 72px Inter, sans-serif";
    ctx.fillText(s.value, x + 24, sy + 130);
  });

  ctx.fillStyle = "#d6ff3a";
  ctx.font = "800 40px Inter, sans-serif";
  ctx.fillText("Show up. Get seen.", 72, 1080);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "500 26px Inter, sans-serif";
  ctx.fillText("Verified accountability, not vanity metrics.", 72, 1124);

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "600 24px ui-monospace, monospace";
  ctx.fillText(`openstage.app/@${input.user.handle}`, 72, H - 64);

  ctx.fillStyle = "#d6ff3a";
  roundRect(ctx, W - 220, H - 110, 148, 48, 24);
  ctx.fill();
  ctx.fillStyle = "#0a0d12";
  ctx.font = "800 22px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("VERIFIED", W - 146, H - 78);
  ctx.textAlign = "start";
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}