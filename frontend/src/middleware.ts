export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/setup", "/dashboard", "/interview/:path*", "/result/:path*"],
};
