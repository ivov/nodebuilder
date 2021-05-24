import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import { descriptionsOutputDir, hygen, inputDir, outputDir } from "../config";

export default class Generator {
  private mainParams: MainParams;
  private resourceJson = path.join(inputDir, "_resource.json");

  constructor(mainParams: MainParams) {
    this.mainParams = mainParams;
  }

  /**Generate all node functionality files:
   * - `*.node.ts`,
   * - one `*Description.ts` per resource,
   * - `GenericFunctions.ts`, and ← TODO
   * - `*.credentials.ts` if needed. ← TODO*/
  public run() {
    this.validateDirs();

    this.generateResourceDescriptions();

    this.generateRegularNodeFile();

    this.generateGenericFunctionsFile();

    // if (this.metaParams.authType !== "None") {
    //   this.generateCredentialsFile();
    // }
  }

  private executeCommand(command: string) {
    try {
      execSync(`env HYGEN_OVERWRITE=1 node ${hygen} ${command}`);
    } catch (error) {
      console.log(error.stdout.toString());
      console.log(error.message);
    }
  }

  private generateRegularNodeFile() {
    this.executeCommand("make regularNodeFile");
  }

  private generateGenericFunctionsFile() {
    this.executeCommand("make genericFunctions");
  }

  /**For every resource in main params, generate a resource JSON file, feeds it into
   * the Hygen template for code generation and deletes the resource JSON file.*/
  private generateResourceDescriptions() {
    // TEMP: only first resource -----------------------------
    // const firstResourceName = Object.keys(this.mainParams)[0];
    // this.saveResourceJson(
    //   firstResourceName,
    //   this.mainParams[firstResourceName]
    // );

    // this.executeCommand("make resourceDescription");

    // const resourceNames = Object.keys(this.mainParams);
    // this.executeCommand(`make resourceIndex --resourceNames ${resourceNames}`);
    // unlinkSync(this.resourceJson);
    // TEMP -------------------------------------------

    // FINAL VERSION: ALL RESOURCES
    const resourceNames = Object.keys(this.mainParams);
    Object.entries(this.mainParams).forEach(
      ([resourceName, operationsArray]) => {
        this.saveResourceJson(resourceName, operationsArray);
        this.executeCommand("make resourceDescription");
        fs.unlinkSync(this.resourceJson);
      }
    );
    this.executeCommand(`make resourceIndex --resourceNames ${resourceNames}`);
  }

  private validateDirs() {
    [inputDir, outputDir, descriptionsOutputDir].forEach((dir) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    });
  }

  private saveResourceJson(resourceName: string, operationsArray: Operation[]) {
    fs.writeFileSync(
      this.resourceJson,
      JSON.stringify({ resourceName, operationsArray }, null, 2),
      "utf8"
    );
  }
}
