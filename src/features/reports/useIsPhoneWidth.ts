"use client";

import { useEffect, useState } from "react";

const PHONE_MEDIA_QUERY = "(max-width: 639px)";

export function useIsPhoneWidth() {
  const [isPhoneWidth, setIsPhoneWidth] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(PHONE_MEDIA_QUERY);
    const update = () => setIsPhoneWidth(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, []);

  return isPhoneWidth;
}
