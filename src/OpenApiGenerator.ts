import { execSync as exec } from "child_process";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";

export default class OpenApiNodeGenerator {
  private readonly resourcesDir = join("src", "output", "resources");
  private readonly resourcesJson = join(this.resourcesDir, "Resource.json");
  private readonly hygenBin = join("node_modules", "hygen", "dist", "bin.js");

  constructor(
    private mainParams: MainParams,
    private nodeGenerationType: keyof typeof NodeGenerationType
  ) {}

  /**Generates all node functionality files: `*.node.ts`, `GenericFunctions.ts`, `*.credentials.ts`, and (in complex mode) one `*Description.ts` file per resource.*/
  public run() {
    if (this.nodeGenerationType === "SingleFile") {
      this.executeCommand("make regularNodeSingleFile");
    }

    if (this.nodeGenerationType === "MultiFile") {
      // this.executeCommand("gen regularNodeMultipleFiles")
      this.generateResourceDescriptions();
    }

    // this.generateGenericFunctionsFile();

    // if (this.metaParams.authType !== AuthType.None) {
    //   this.generateCredentialsFile();
    // }
  }

  private executeCommand(command: string) {
    console.log(`env HYGEN_OVERWRITE=1 node ${this.hygenBin} ${command}`);
    return exec(`env HYGEN_OVERWRITE=1 node ${this.hygenBin} ${command}`);
  }

  private generateResourceDescriptions() {
    if (!existsSync(this.resourcesDir)) mkdirSync(this.resourcesDir);

    // temp - single
    this.saveResourceJson("Users", this.mainParams["Users"]);
    this.executeCommand("make resourceDescription");

    // final - all
    // Object.entries(this.mainParams).forEach(
    //   ([resourceName, resourceObject]) => {
    //     this.saveResourceJson(resourceName, resourceObject);
    //     this.executeCommand("make generateResourceDescription");
    //     // this.deleteResourceJson();
    //   }
    // );

    unlinkSync(this.resourcesJson);
  }

  private saveResourceJson(resourceName: string, resourceObject: Resource) {
    writeFileSync(
      this.resourcesJson,
      JSON.stringify({ resourceName, resourceObject }, null, 2),
      "utf8"
    );
  }
}
