import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - AlignAI",
  description: "Sign in or create an account to start aligning your team",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
