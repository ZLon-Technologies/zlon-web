import { NextResponse } from "next/server";

export function middleware(request) {
  const host = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  if (host.includes("mybusiness.zlon.in")) {
    if (url.pathname.startsWith("/wallet")) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  } else if (host.includes("zlon.in")) {
    if (url.pathname.startsWith("/business")) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
