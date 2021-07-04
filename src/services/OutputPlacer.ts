import fs from "fs";
import path from "path";
import os from "os";
import { promisify } from "util";
import { outputDir } from "../config";

const place = promisify(fs.rename);
const rmdir = promisify(fs.rmdir);

export class OutputPlacer {
  private rootFilesToPlace = fs.readdirSync(outputDir);
  private outputPackageJsonPath = path.join(outputDir, "package.json");
  private nodeTs: string; // *.node.ts

  private targetType: "clone" | "custom";
  private targetDir: string;
  private n8nRootDir = path.join(__dirname, "..", "..", "..", "n8n");
  private nodesBaseDir = path.join(this.n8nRootDir, "packages", "nodes-base");

  constructor({ targetType }: { targetType: "clone" | "custom" }) {
    this.targetType = targetType;
    this.targetDir =
      targetType === "clone"
        ? path.join(this.nodesBaseDir, "nodes")
        : path.join(os.homedir(), ".n8n", "custom");
  }

  public async run() {
    this.prePlacementCheck();

    if (this.targetType === "clone") {
      await this.placePackageJson();
    }

    await this.placeRootTsFiles();
    await this.placeDescriptionsTsFiles();

    await this.removeDescriptionsDir();
  }

  private prePlacementCheck() {
    if (!fs.existsSync(this.outputPackageJsonPath))
      throw new Error("No `package.json` file found in /output dir");

    const nodeTs = this.rootFilesToPlace.find((f) => f.endsWith(".node.ts"));

    if (!nodeTs) throw new Error("No `*.node.ts` file found in /output dir");

    this.nodeTs = nodeTs;

    const genericFunctionsTs = this.rootFilesToPlace.find(
      (f) => f === "GenericFunctions.ts"
    );

    if (!genericFunctionsTs)
      throw new Error("No `GenericFunctions.ts` file found in /output dir");
  }

  private async placePackageJson() {
    const dest = path.join(this.nodesBaseDir, "package.json");
    await place(this.outputPackageJsonPath, dest);
  }

  private async placeRootTsFiles() {
    const rootTsFiles = this.rootFilesToPlace.filter((f) => f.endsWith(".ts"));

    if (!fs.existsSync(this.targetDir)) fs.mkdirSync(this.targetDir);

    const destDir = path.join(
      this.targetDir,
      this.nodeTs.replace(".node.ts", "")
    );

    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir);

    rootTsFiles.forEach(async (rootTsFile) => {
      const src = path.join(outputDir, rootTsFile);
      const dest = path.join(destDir, rootTsFile);
      await place(src, dest);
    });
  }

  private async placeDescriptionsTsFiles() {
    if (!fs.existsSync(path.join(outputDir, "descriptions"))) return;

    const tsDescriptions = fs
      .readdirSync(path.join(outputDir, "descriptions"))
      .filter((f) => f.endsWith(".ts"));

    const destDir = path.join(
      this.targetDir,
      this.nodeTs.replace(".node.ts", ""),
      "descriptions"
    );

    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir);

    tsDescriptions.forEach(async (tsDescription) => {
      const src = path.join(outputDir, "descriptions", tsDescription);
      const dest = path.join(destDir, tsDescription);
      await place(src, dest);
    });
  }

  private async removeDescriptionsDir() {
    await rmdir(path.join(outputDir, "descriptions"));
  }
}
