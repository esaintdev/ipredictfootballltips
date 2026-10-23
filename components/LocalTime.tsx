"use client";

import { useEffect, useState } from "react";

/** Renders a timestamp in the visitor's own timezone (UTC on the server render). */
export function LocalTime({ iso, mode = "time" }: { iso: string | Date; mode?: "time" | "date" | "datetime" }) {
  const d = new Date(iso);
  const fmt = (tz?: string) =>
    d.toLocaleString("en-GB", {
      timeZone: tz,
      ...(mode !== "date" ? { hour: "2-digit", minute: "2-digit" } : {}),
      ...(mode !== "time" ? { weekday: "short", day: "numeric", month: "short" } : {}),
    });
  const [text, setText] = useState(() => fmt("UTC"));
  useEffect(() => setText(fmt()), [iso]); // eslint-disable-line react-hooks/exhaustive-deps
  return <time dateTime={d.toISOString()} suppressHydrationWarning>{text}</time>;
}
