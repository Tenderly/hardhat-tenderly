import fs from "fs";
import * as yaml from "js-yaml";
import os from "os";
import path from "path";

const filepath = os.homedir() + path.sep + ".tenderly" + path.sep + "config.yaml";

export function initConfig() {
    const yamlData = {
        access_key: "",
        access_key_id: "",
        account_id: "",
        email: "",
        token: "",
        username: ""
    };

    fs.writeFileSync(filepath, yaml.safeDump(yamlData), "utf8");
}

export function getConfig() {
    const fileData = fs.readFileSync(filepath);
    const yamlData = yaml.load(fileData.toString());

    return yamlData;
}

export function configExists(): boolean {
    return fs.existsSync(filepath);
}

export function isAccessTokenSet(): boolean {
    if (!configExists()) {
        return false;
    }

    const accessToken = getConfig().access_key

    return accessToken != undefined && accessToken != "";
}

export function getAccessToken(): string {
    if (!isAccessTokenSet()) {
        return "";
    }

    return getConfig().access_key;
}

export function setAccessToken(accessToken: string) {
    const yamlData = getConfig();
    yamlData.access_key = accessToken;

    fs.writeFileSync(filepath, yaml.safeDump(yamlData), "utf8");
}
