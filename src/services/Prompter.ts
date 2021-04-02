import { inputDir, openApiInputDir, yamlInputDir } from "../config";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import inquirer from "inquirer";

const readDir = promisify(fs.readdir);

export default class Prompter {
  constructor() {
    this.validateDirs();
  }

  private validateDirs() {
    [inputDir, yamlInputDir, openApiInputDir].forEach((dir) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    });
  }

  public async askForSourceType() {
    const { sourceType } = await inquirer.prompt<{
      sourceType: InputFileFormat;
    }>([
      {
        name: "sourceType",
        type: "list",
        message: "Select the input file format.",
        choices: ["YAML", "OpenAPI"],
      },
    ]);

    return sourceType;
  }

  public async askForYamlFile() {
    const { yamlFile } = await inquirer.prompt<{ yamlFile: string }>([
      {
        name: "yamlFile",
        type: "list",
        message: "Select the input YAML file.",
        choices: await this.getInputFiles("yaml"),
      },
    ]);

    return yamlFile;
  }

  public async askForOpenApiFile() {
    const { openApiFile } = await inquirer.prompt<{ openApiFile: string }>([
      {
        name: "openApiFile",
        type: "list",
        message: "Select the input OpenAPI file.",
        choices: await this.getInputFiles("openApi"),
      },
    ]);

    return openApiFile;
  }

  private async getInputFiles(format: "yaml" | "openApi") {
    const files = await readDir(path.join(inputDir, format));
    return files.filter((file) => file !== ".gitkeep");
  }
}
