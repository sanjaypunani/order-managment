import { Metadata } from "next";
import MainLayout from "../components/MainLayout";

export const metadata: Metadata = {
  title: "AI Orders - Shree Hari Mart",
  description: "Manage and review AI-generated orders",
};

export default function AIOrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
