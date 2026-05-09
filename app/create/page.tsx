import dynamic from "next/dynamic";

const CreatePageClient = dynamic(
  () => import("./CreatePageClient").then((m) => ({ default: m.CreatePageClient })),
  { ssr: false }
);

export default function CreatePage() {
  return <CreatePageClient />;
}
