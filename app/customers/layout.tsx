import MainLayout from "../components/MainLayout";

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
