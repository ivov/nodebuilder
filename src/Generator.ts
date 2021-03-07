import { execSync } from "child_process";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";

export default class Generator {
  private mainParams: MainParams;
  private source: GenerationSource;

  private inputDir = join("src", "input");
  private outputDir = join("src", "output", "descriptions");

  private resourceJson = join(this.inputDir, "_resource.json");
  private hygen = join("node_modules", "hygen", "dist", "bin.js");

  constructor(source: GenerationSource, mainParams: MainParams) {
    this.source = source;
    this.mainParams = mainParams;
  }

  /**Generates all node functionality files:
   * - `*.node.ts`,
   * - one `*Description.ts` per resource,
   * - `GenericFunctions.ts`, and
   * - `*.credentials.ts` if needed.*/
  public run() {
    this.generateResourceDescriptions();
    this.generateRegularNodeFile();

    // this.generateGenericFunctionsFile();

    // if (this.metaParams.authType !== "None") {
    //   this.generateCredentialsFile();
    // }
  }

  private generateRegularNodeFile() {
    this.executeCommand(`make regularNodeFile --source=${this.source}`);
  }

  private executeCommand(command: string) {
    try {
      execSync(`env HYGEN_OVERWRITE=1 node ${this.hygen} ${command}`);
    } catch (error) {
      console.log(error.stdout.toString());
      console.log(error.message);
    }
  }

  /**For every resource in main params, generates a resource JSON file, feeds it into
   * the Hygen template for code generation and deletes the resource JSON file.*/
  private generateResourceDescriptions() {
    this.createDirs();

    // TEMP: only first resource -----------------------------
    const firstResourceName = Object.keys(this.mainParams)[0];
    this.saveResourceJson(
      firstResourceName,
      this.mainParams[firstResourceName]
    );

    this.executeCommand("make resourceDescription");

    const resourceNames = Object.keys(this.mainParams);
    this.executeCommand(`make resourceIndex --resourceNames ${resourceNames}`);
    unlinkSync(this.resourceJson);
    // TEMP -------------------------------------------

    // FINAL VERSION: ALL RESOURCES
    // Object.entries(this.mainParams).forEach(
    //   ([resourceName, operationsArray]) => {
    //     this.saveResourceJson(resourceName, operationsArray);
    //     this.executeCommand("make generateResourceDescription");
    //     unlinkSync(this.resourceJson);
    //   }
    // );
    // this.executeCommand(
    //   `make resourceIndex --resourceNames ${resourceNames}`
    // );
  }

  private createDirs() {
    [this.inputDir, this.outputDir].forEach((dir) => {
      if (!existsSync(dir)) mkdirSync(dir);
    });
  }

  private saveResourceJson(resourceName: string, operationsArray: Resource) {
    writeFileSync(
      this.resourceJson,
      JSON.stringify({ resourceName, operationsArray }, null, 2),
      "utf8"
    );
  }
}
