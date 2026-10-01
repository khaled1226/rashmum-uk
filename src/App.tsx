import { useEffect, useState } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import AdminDashboard from "./components/AdminDashboard";
import ChatWidget from "./components/ChatWidget";
import LandingPage from "./components/LandingPage";
import { convexApiBase } from "./convexUrl";

const address = convexApiBase();
const convex = address ? new ConvexReactClient(address) : null;

// Hash-based route (static hosting friendly, no server rewrites needed):
// "#/admin" opens the volunteer dashboard, everything else shows the site.
function useHashRoute() {
  const [route, setRoute] = useState(() =>
    typeof window === "undefined" ? "" : window.location.hash
  );
  useEffect(() => {
    const onChange = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export default function App() {
  const route = useHashRoute();

  if (route.startsWith("#/admin")) {
    return <AdminDashboard live={!!convex} />;
  }

  if (!convex) {
    // Graceful preview mode: the site renders fully, live features show a notice.
    return (
      <>
        <div className="fixed inset-x-0 top-0 z-50 bg-amber-100 border-b border-amber-200 px-4 py-1.5 text-center text-[11px] font-medium text-amber-900">
          Preview mode — live chat, forms and 24/7 automation connect once Convex is linked.
        </div>
        <LandingPage live={false} />
        <ChatWidget live={false} />
      </>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <LandingPage live={true} />
      <ChatWidget live={true} />
    </ConvexProvider>
  );
}
