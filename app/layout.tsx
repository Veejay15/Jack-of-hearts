import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jack of Hearts",
  description:
    "A 6-player social deduction game inspired by Alice in Borderland.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
