import { execSync } from "child_process";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";

export default class OpenApiNodeGenerator {
  private readonly mainParams: MainParams;
  private readonly nodeGenerationType: NodeGenerationType;
  private readonly inputDir = join("src", "input");
  private readonly resourceJson = join(this.inputDir, "Resource.json");
  private readonly hygenBin = join("node_modules", "hygen", "dist", "bin.js");

  constructor({
    mainParams,
    nodeGenerationType,
  }: {
    mainParams: MainParams;
    nodeGenerationType: NodeGenerationType;
  }) {
    this.mainParams = mainParams;
    this.nodeGenerationType = nodeGenerationType;
  }

  /**Generates all node functionality files:
   * - `*.node.ts`,
   * - one `*Description.ts` file per resource (if applicable),
   * - `GenericFunctions.ts`, and
   * - `*.credentials.ts`.*/
  public run() {
    if (this.nodeGenerationType === "SingleFile") {
      this.generateResourceDescriptions(); // TEMP FOR DEBUGGING: This belongs to multifile
      this.executeCommand("make regularNodeFile");
    }

    if (this.nodeGenerationType === "MultiFile") {
      // this.executeCommand("gen regularNodeMultipleFiles")
      this.generateResourceDescriptions();
    }

    // this.generateGenericFunctionsFile();

    // if (this.metaParams.authType !== "None") {
    //   this.generateCredentialsFile();
    // }
  }

  private executeCommand(command: string) {
    try {
      execSync(`env HYGEN_OVERWRITE=1 node ${this.hygenBin} ${command}`);
    } catch (error) {
      console.log(error.stdout.toString());
      console.log(error.message);
    }
  }

  /**For every resource in main params, generates a resource JSON file, feeds it into
   * the Hygen template for code generation and deletes the resource JSON file.*/
  private generateResourceDescriptions() {
    if (!existsSync(this.inputDir)) mkdirSync(this.inputDir);

    // TEMP FOR DEBUGGING - single resource: only "Users"
    this.saveResourceJson("Users", this.mainParams["Users"]);
    this.executeCommand("make resourceDescription");
    unlinkSync(this.resourceJson);

    // final version - all resources
    // Object.entries(this.mainParams).forEach(
    //   ([resourceName, operationsArray]) => {
    //     this.saveResourceJson(resourceName, operationsArray);
    //     this.executeCommand("make generateResourceDescription");
    //     unlinkSync(this.resourceJson);
    //   }
    // );
  }

  private saveResourceJson(resourceName: string, operationsArray: Resource) {
    writeFileSync(
      this.resourceJson,
      JSON.stringify({ resourceName, operationsArray }, null, 2),
      "utf8"
    );
  }
}
