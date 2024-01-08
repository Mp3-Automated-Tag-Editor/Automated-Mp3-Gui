"use client";

import React, { createContext, useState, FC, ReactElement, useEffect } from "react";
import { ConfigContextState } from "./types";
import { invoke } from "@tauri-apps/api/tauri";
import { Store } from "tauri-plugin-store-api";

// interface Settings {
//     threads: number,
//     test: string,
//     developerSettings: boolean
// }

const store = new Store(".settings.dat");

const contextDefaultValues: ConfigContextState = {
    configs: {},
    addConfig: () => { }
};
type ConfigObject = {
    key: string
    value: any
};
export const ConfigContext = createContext<ConfigContextState>(
    contextDefaultValues
);
type ProviderPorps = {
    defaultData: any,
    children: ReactElement
}

const ConfigsProvider: FC<ProviderPorps> = (props) => {
    const [configs, setConfigs] = useState<any>(props.defaultData);

    useEffect(() => {
        const asFunction = async () => {
            // let jsonData: Settings = await invoke('get_settings_data');
            // setSettingsJsonData(jsonData)
            await store.load();

            const keys = await store.keys()

            if (!keys.includes('settings')) {
                await store.set("settings",
                    {
                        "test": "test",
                        "threads": 1,
                        "developerSettings": false,
                    }
                );

                await store.save();
            }
            const data = await store.get("settings");
            setConfigs(data);
        }
        asFunction();
    }, [])

    const addConfig = async (prevConfig: any, newConfig: ConfigObject) => {
        prevConfig[newConfig.key] = newConfig.value;

        setConfigs(prevConfig);

        await store.set("settings", prevConfig);
        await store.save();

        invoke("save_settings", { data: prevConfig });
    }

    return (
        <ConfigContext.Provider value={{ configs, addConfig }}>
            {props.children}
        </ConfigContext.Provider>
    );
};
export default ConfigsProvider;