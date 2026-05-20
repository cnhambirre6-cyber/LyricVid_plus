"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Component, type ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const isValidUrl =
  convexUrl &&
  convexUrl.startsWith("https://") &&
  !convexUrl.includes("placeholder");

const convex = isValidUrl ? new ConvexReactClient(convexUrl) : null;

class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const ConfigFallback = () => (
  <div
    style={{
      minHeight: "100vh",
      background: "#080810",
      color: "#eeeef8",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
      padding: "2rem",
      textAlign: "center",
      gap: "1rem",
    }}
  >
    <div style={{ fontSize: "2rem" }}>🎬</div>
    <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#7c3aed" }}>
      LirycVid+
    </h1>
    <p style={{ color: "#8080a8", maxWidth: 480 }}>
      Backend not configured. Add your Convex deployment URL as{" "}
      <code
        style={{
          background: "#171728",
          padding: "2px 6px",
          borderRadius: 4,
          color: "#eeeef8",
        }}
      >
        NEXT_PUBLIC_CONVEX_URL
      </code>{" "}
      in GitHub → Settings → Secrets → Actions, then re-run the deployment
      workflow.
    </p>
    <p style={{ color: "#8080a8", fontSize: "0.85rem" }}>
      Get your URL at{" "}
      <span style={{ color: "#7c3aed" }}>dashboard.convex.dev</span> → your
      project → Settings → Deployment URL
    </p>
  </div>
);

export function Providers({ children }: { children: ReactNode }) {
  if (!convex) return <ConfigFallback />;
  return (
    <ErrorBoundary fallback={<ConfigFallback />}>
      <ConvexProvider client={convex}>{children}</ConvexProvider>
    </ErrorBoundary>
  );
}
