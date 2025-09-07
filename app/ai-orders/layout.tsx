import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Orders - Shree Hari Mart",
  description: "Manage and review AI-generated orders",
};

export default function AIOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
