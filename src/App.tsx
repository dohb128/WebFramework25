import { useState } from "react";
import { TopNavigation } from "./components/layout/TopNavigation";
import { HomePage } from "./components/home/HomePage";
import FacilityReservation from "./components/facility/FacilityReservation.tsx";
import { VehicleDispatch } from "./components/vehicle/VehicleDispatch";
import { StatsCharts } from "./components/dashboard/StatsCharts";
import { LoginPage } from "./components/auth/LoginPage.tsx";
import { RegisterPage } from "./components/auth/RegisterPage.tsx";
import { MyPage } from "./components/profile/MyPage.tsx";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomePage onNavigate={setActiveTab} />;
      case "login":
        return <LoginPage onNavigate={setActiveTab} />;
      case "register":
        return <RegisterPage onNavigate={setActiveTab} />;
      case "facility-reservation":
        return <FacilityReservation />;
      case "vehicle-dispatch":
        return <VehicleDispatch />;
      case "dashboard":
        return <StatsCharts />;
      case "my-page":
        return <MyPage />;

      default:
        return <HomePage onNavigate={setActiveTab} />;
    }
  };

  return (
  <div className="min-h-screen bg-background flex flex-col">
    <TopNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    <main className="flex-1 flex justify-center px-6 py-8">
      <div className="w-full max-w-5xl mx-auto">
        {renderContent()}
      </div>
    </main>
  </div>
);

}