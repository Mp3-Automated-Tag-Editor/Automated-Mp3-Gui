export type ConfigContextState = {
    configs: any;
    addConfig: (prevConfig: any, config: ConfigObject) => void;
};
type ConfigObject = {
    key: string
    value: any
};