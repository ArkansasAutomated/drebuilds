import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { HUDBar } from "./HUDBar";

interface CommandCenterLayoutProps {
  children: ReactNode;
}

export const CommandCenterLayout = ({ children }: CommandCenterLayoutProps) => {
  return (
    <div className="min-h-screen bg-background bg-grid bg-noise">
      {/* Fixed Left Sidebar - 64px width */}
      <AdminSidebar />
      
      {/* Main Content Area */}
      <div className="ml-16">
        {/* Fixed Top HUD Bar - 48px height */}
        <HUDBar />
        
        {/* Scrollable Content */}
        <main className="pt-16 px-6 pb-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};
