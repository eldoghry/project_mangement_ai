"use client";

import { useEffect, useState } from "react";
import { Board } from "@/components/Board";

export function BoardClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-full min-h-0 flex-1" />;
  }

  return <Board />;
}
