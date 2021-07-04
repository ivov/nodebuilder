import fs from "fs";
import path from "path";
import { promisify } from "util";

import inquirer from "inquirer";

import { inputDir, openApiInputDir, customInputDir } from "../config";

const readDir = promisify(fs.readdir);

export default class Prompter {
  constructor() {
    this.validateDirs();
  }

  private validateDirs() {
    [inputDir, customInputDir, openApiInputDir].forEach((dir) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    });
  }

  public async askForSourceType() {
    const { sourceType } = await inquirer.prompt<{
      sourceType: "OpenAPI spec in YAML or JSON" | "Custom API mapping in YAML";
    }>([
      {
        name: "sourceType",
        type: "list",
        message: "Select the source.",
        choices: ["OpenAPI spec in YAML or JSON", "Custom API mapping in YAML"],
      },
    ]);

    return sourceType;
  }

  public async askForCustomYamlFile() {
    const { yamlFile } = await inquirer.prompt<{ yamlFile: string }>([
      {
        name: "yamlFile",
        type: "list",
        message: "Select the custom API mapping in YAML.",
        choices: await this.getInputFiles("custom"),
      },
    ]);

    return yamlFile;
  }

  public async askForOpenApiFile() {
    const { openApiFile } = await inquirer.prompt<{ openApiFile: string }>([
      {
        name: "openApiFile",
        type: "list",
        message: "Select the OpenAPI file in JSON or YAML.",
        choices: await this.getInputFiles("openApi"),
      },
    ]);

    return openApiFile;
  }

  private async getInputFiles(sourceType: "custom" | "openApi") {
    const files = await readDir(path.join(inputDir, sourceType));
    return files.filter((file) => file !== ".gitkeep");
  }

  public async askForPlacementTargetType() {
    const { placementTargetType } = await inquirer.prompt<{
      placementTargetType: "clone" | "custom";
    }>([
      {
        name: "placementTargetType",
        type: "list",
        message: "Select the target dir",
        choices: ["clone", "custom"],
      },
    ]);

    return placementTargetType;
  }
}
