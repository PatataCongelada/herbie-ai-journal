import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20 max-w-lg mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
