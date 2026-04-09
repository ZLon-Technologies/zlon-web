"use client";

import { useEffect } from "react";

export default function BusinessEntry() {
  useEffect(() => {
    if (window.location.hostname !== "mybusiness.zlon.in") {
      window.location.href = "https://mybusiness.zlon.in";
    } else {
      window.location.href = "/";
    }
  }, []);

  return (
    <div className="center-screen">
      <div className="zlon-logo">ZLon.</div>
    </div>
  );
}
