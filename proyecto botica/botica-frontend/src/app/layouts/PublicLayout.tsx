import { Outlet } from "react-router";
import { Navbar } from "../components/Navbar";
import { TopBar } from "../components/TopBar";
import { SecondaryNav } from "../components/SecondaryNav";
import { Footer } from "../components/Footer";

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Navbar />
      <SecondaryNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
