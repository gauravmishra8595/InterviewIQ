
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import Logo from "./Logo";
import UserMenu from "./UserMenu";

const HIDDEN_ROUTES = [
  "/interview",
  "/login",
  "/register",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
];

export default function Navbar() {
  const { status } = useSession();
  const pathname = usePathname();

  const hidden = HIDDEN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (hidden) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo href={status === "authenticated" ? "/dashboard" : "/"} />

        <nav className="flex items-center gap-2">
          {status === "authenticated" ? (
            <>
              <Link
                href="/dashboard"
                className="btn btn-quiet hidden sm:inline-flex"
              >
                Dashboard
              </Link>

              <Link
                href="/setup"
                className="btn btn-primary hidden sm:inline-flex"
              >
                New interview
              </Link>

              <UserMenu />
            </>
          ) : status === "unauthenticated" ? (
            <>
              <Link href="/login" className="btn btn-quiet">
                Log in
              </Link>

              <Link href="/register" className="btn btn-primary">
                Create account
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
// "use client";

// import { useSession } from "next-auth/react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";

// import Logo from "./Logo";
// import UserMenu from "./UserMenu";

// export default function Navbar() {
//   const { status } = useSession();
//   const pathname = usePathname();
//   const hidden = ["/interview", "/login", "/register", "/forgot-password", "/verify-otp", "/reset-password"];
//   if (hidden.some((p) => pathname.startsWith(p))) return null; // these screens bring their own header

//   return (
//     <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur">
//       <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
//         <Logo href={status === "authenticated" ? "/dashboard" : "/"} />
//         <nav className="flex items-center gap-2">
//           {status === "authenticated" ? (
//             <>
//               <Link href="/dashboard" className="btn btn-quiet hidden sm:inline-flex">Dashboard</Link>
//               <Link href="/setup" className="btn btn-primary hidden sm:inline-flex">New interview</Link>
//               <UserMenu />
//             </>
//           ) : status === "unauthenticated" ? (
//             <>
//               <Link href="/login" className="btn btn-quiet">Log in</Link>
//               <Link href="/register" className="btn btn-primary">Create account</Link>
//             </>
//           ) : null}
//         </nav>
//       </div>
//     </header>
//   );
// }