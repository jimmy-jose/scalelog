import { useEffect } from "react";
import { inject } from "@vercel/analytics";

export function WebAnalytics() {
  useEffect(() => {
    inject();
  }, []);
  return null;
}

