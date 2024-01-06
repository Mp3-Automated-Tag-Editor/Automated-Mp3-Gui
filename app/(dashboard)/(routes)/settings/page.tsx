"use client";

import SettingsProfilePage from "./profile-page";
import { ConfigContext } from "../../../../components/context/ConfigContext";
import { useContext } from "react";

function SettingsPage() {
  const { configs, addConfig } = useContext(ConfigContext);

  console.log(configs);

  // addConfig(configs, {
  //   key: "username",
  //   value: "john_doe"
  // });

  // console.log(configs);

  // addConfig(configs, {
  //   key: "username",
  //   value: "john_boe"
  // });

  // console.log(configs);

  // addConfig(configs, {
  //   key: "test",
  //   value: "lalalal"
  // });

  // console.log(configs);

  // // const isPro = false;

  return (
    <div className="px-4 lg:px-8 space-y-4">
      <SettingsProfilePage />
    </div>
  );
}

export default SettingsPage;

