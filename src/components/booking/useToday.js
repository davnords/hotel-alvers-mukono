"use client";
import { useEffect, useState } from "react";

// Today's date in Uganda (UTC+3) as YYYY-MM-DD, calculated in the visitor's browser.
// Returns null during the first render (server pre-render), then the real date.
export function ugandaToday() {
  return new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
}

export function useToday() {
  const [t, setT] = useState(null);
  useEffect(() => { setT(ugandaToday()); }, []);
  return t;
}
