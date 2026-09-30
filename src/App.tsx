import { ConvexProvider, ConvexReactClient } from "convex/react";
import ChatWidget from "./components/ChatWidget";
import LandingPage from "./components/LandingPage";
import { convexApiBase } from "./convexUrl";

const address = convexApiBase();
const convex = address ? new ConvexReactClient(address) : null;

export default function App() {
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
