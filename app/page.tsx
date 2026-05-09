import dynamic from "next/dynamic";

const DashboardClient = dynamic(
  () => import("./DashboardClient").then((m) => ({ default: m.DashboardClient })),
  { ssr: false }
);

export default function RootPage() {
  return <DashboardClient />;
}
