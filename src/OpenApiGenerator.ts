import { execSync } from "child_process";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";

export default class OpenApiNodeGenerator {
  private readonly mainParams: MainParams;
  private readonly inputDir = join("src", "input");
  private readonly resourceJson = join(this.inputDir, "_resource.json");
  private readonly outputDir = join("src", "output", "descriptions");

  constructor(mainParams: MainParams) {
    this.mainParams = mainParams;
  }

  /**Generates all node functionality files:
   * - `*.node.ts`,
   * - one `*Description.ts` per resource,
   * - `GenericFunctions.ts`, and
   * - `*.credentials.ts` if applicable.*/
  public run() {
    this.generateResourceDescriptions();
    this.executeCommand("make regularNodeFile");

    // this.generateGenericFunctionsFile();

    // if (this.metaParams.authType !== "None") {
    //   this.generateCredentialsFile();
    // }
  }

  private executeCommand(command: string) {
    const hygen = join("node_modules", "hygen", "dist", "bin.js");

    try {
      execSync(`env HYGEN_OVERWRITE=1 node ${hygen} ${command}`);
    } catch (error) {
      console.log(error.stdout.toString());
      console.log(error.message);
    }
  }

  /**For every resource in main params, generates a resource JSON file, feeds it into
   * the Hygen template for code generation and deletes the resource JSON file.*/
  private generateResourceDescriptions() {
    this.createDirs();

    // TEMP -------------------------------------------
    // only first resource
    const firstResource = Object.keys(this.mainParams)[0];
    this.saveResourceJson(firstResource, this.mainParams[firstResource]);
    this.executeCommand("make resourceDescription");
    // unlinkSync(this.resourceJson);
    // TEMP -------------------------------------------

    // FINAL VERSION: ALL RESOURCES
    // Object.entries(this.mainParams).forEach(
    //   ([resourceName, operationsArray]) => {
    //     this.saveResourceJson(resourceName, operationsArray);
    //     this.executeCommand("make generateResourceDescription");
    //     unlinkSync(this.resourceJson);
    //   }
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
