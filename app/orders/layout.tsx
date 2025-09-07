import MainLayout from "../components/MainLayout";

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
