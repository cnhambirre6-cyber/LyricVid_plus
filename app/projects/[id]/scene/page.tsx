import dynamic from "next/dynamic";

const SceneProjectWorkspaceClient = dynamic(
  () =>
    import("./SceneProjectWorkspaceClient").then((m) => ({
      default: m.SceneProjectWorkspaceClient,
    })),
  { ssr: false }
);

export default function SceneVideoPage() {
  return <SceneProjectWorkspaceClient />;
}
