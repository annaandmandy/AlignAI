import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - AlignAI",
  description: "Manage your teams and projects",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
