import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const TIMEOUT = 30 * 60 * 1000; // 30 minutes in ms

export function useSessionTimeout() {
  const router = useRouter();
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        localStorage.removeItem("user");
        router.replace("/login");
      }, TIMEOUT);
    };

    // Listen to user activity
    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer(); // Start timer on mount

    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [router]);
} 