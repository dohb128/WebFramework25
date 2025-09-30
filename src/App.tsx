import { useState } from "react";
import { TopNavigation } from "./components/layout/TopNavigation";
import { HomePage } from "./components/home/HomePage";
import FacilityReservation from "./components/facility/FacilityReservation";
import type { Facility } from "./components/facility/FacilityReservation";
import { FacilityBooking } from "./components/facility/FacilityBooking"; // ✅ 새 컴포넌트
import FacilityManagement from "./components/facilities/FacilityManagement";
import { VehicleDispatch } from "./components/vehicle/VehicleDispatch";
import { StatsCharts } from "./components/dashboard/StatsCharts";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { MyPage } from "./components/profile/MyPage";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null
  );

  // 헬퍼 함수
  const setSelectedFacilityAndTab = (facility: Facility) => {
    setSelectedFacility(facility);
    setActiveTab("facility-detail");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomePage onNavigate={setActiveTab} />;
      case "login":
        return <LoginPage onNavigate={setActiveTab} />;
      case "register":
        return <RegisterPage onNavigate={setActiveTab} />;
      case "facility-reservation":  
        return (
          <FacilityReservation onSelectFacility={setSelectedFacilityAndTab} />
        );
      case "facility-detail": // 상세 화면
        return selectedFacility ? (
          <FacilityBooking
            facility={selectedFacility}
            onBack={() => setActiveTab("facility-reservation")}
          />
        ) : (
          <FacilityReservation onSelectFacility={setSelectedFacilityAndTab} />
        );
      case "vehicle-dispatch":
        return <VehicleDispatch />;
      case "dashboard":
        return <StatsCharts />;
      case "my-page":
        return <MyPage />;
      case "facility-management":
        return <FacilityManagement />;
      default:
        return <HomePage onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 flex justify-center px-6 py-8">
        <div className="w-full max-w-5xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
}
