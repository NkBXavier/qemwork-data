"use client";

import { useEffect } from "react";

export function ClearLocalStorage() {
  useEffect(() => {
    try {
      localStorage.removeItem("qemwork-qualification-v1");
    } catch {
      // ignore
    }
  }, []);
  return null;
}
