"use client";

import React, { createContext, useState, FC, ReactElement, useEffect } from "react";
import { ConfigContextState } from "./types";
import { invoke } from "@tauri-apps/api/tauri";
import { Store } from "tauri-plugin-store-api";
import {
  CONFIG_KEYS,
  DEFAULT_SETTINGS,
  SCRAPE_MODE,
  STORE_FILE,
  STORE_KEYS,
  TAURI_COMMANDS,
} from "@/constants";

const store = new Store(STORE_FILE);

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
            await store.load();

            const keys = await store.keys()

            if (!keys.includes(STORE_KEYS.settings)) {
                await store.set(STORE_KEYS.settings, { ...DEFAULT_SETTINGS });

                await store.save();
            }
            const data = (await store.get(STORE_KEYS.settings)) as Record<string, unknown> | null;
            if (data && data[CONFIG_KEYS.libraryPath] === undefined) data[CONFIG_KEYS.libraryPath] = "";
            if (data && data[CONFIG_KEYS.scrapeMode] === undefined) data[CONFIG_KEYS.scrapeMode] = SCRAPE_MODE.review;
            if (data && data[CONFIG_KEYS.darkSidebar] === undefined) data[CONFIG_KEYS.darkSidebar] = false;
            setConfigs(data);
        }
        asFunction();
    }, [])

    const addConfig = async (prevConfig: any, newConfig: ConfigObject) => {
        const next = { ...prevConfig, [newConfig.key]: newConfig.value };

        setConfigs(next);

        await store.set(STORE_KEYS.settings, next);
        await store.save();

        invoke(TAURI_COMMANDS.saveSettings, { data: next });
    }

    return (
        <ConfigContext.Provider value={{ configs, addConfig }}>
            {props.children}
        </ConfigContext.Provider>
    );
};
export default ConfigsProvider;