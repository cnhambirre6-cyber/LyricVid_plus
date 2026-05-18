import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lirycvidplus.app",
  appName: "LirycVid+",
  webDir: "out",
  // When running on a real device the app loads the bundled static export.
  // Remove / comment the server block for production APK builds.
  server: {
    // Uncomment for live-reload during development:
    // url: "http://YOUR_LOCAL_IP:3000",
    // cleartext: true,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#080810",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#080810",
      showSpinner: false,
    },
  },
};

export default config;
