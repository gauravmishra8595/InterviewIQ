import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import type { ReactNode } from "react";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "InterviewIQ | Practice interviews out loud with instant feedback",
  description: "A free AI mock interview coach for students. Voice interviews, resume-based questions, and scorecards on content, structure and delivery.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}