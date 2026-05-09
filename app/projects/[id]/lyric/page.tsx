import dynamic from "next/dynamic";

const LyricVideoWorkspaceClient = dynamic(
  () =>
    import("./LyricVideoWorkspaceClient").then((m) => ({
      default: m.LyricVideoWorkspaceClient,
    })),
  { ssr: false }
);

export default function LyricVideoPage() {
  return <LyricVideoWorkspaceClient />;
}
