import SettingsProfilePage from "./profile-page";
// import { SubscriptionButton } from "@/components/subscription-button";

const SettingsPage = async () => {
  const isPro = false;

  return (
    <div className="px-4 lg:px-8 space-y-4">
      <SettingsProfilePage />
    </div>
  );
}

export default SettingsPage;

