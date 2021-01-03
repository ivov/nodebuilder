import { execSync as exec } from "child_process";
import { unlinkSync, writeFileSync } from "fs";
import { join, resolve } from "path";

export default class OpenApiNodeGenerator {
  private readonly resourcePath = resolve(
    "./",
    "src",
    "output",
    "temp",
    "Resource.json"
  );

  constructor(
    private mainParams: MainParams,
    private nodeGenerationType: keyof typeof NodeGenerationType
  ) {}

  /**Generates all node functionality files: `*.node.ts`, `GenericFunctions.ts`, `*.credentials.ts`, and (in complex mode) one `*Description.ts` file per resource.*/
  public run() {
    if (this.nodeGenerationType === "SingleFile") {
      this.executeCommand("gen whoa");
    }

    if (this.nodeGenerationType === "SeparateFiles") {
      this.generateResourceDescriptionFile();
    }

    // this.generateGenericFunctionsFile();

    // if (this.metaParams.authType !== AuthType.None) {
    //   this.generateCredentialsFile();
    // }
  }

  private executeCommand(command: string) {
    return exec(
      `env HYGEN_OVERWRITE=1 node node_modules/hygen/dist/bin.js ${command}`
    );
  }

  private generateResourceDescriptionFile() {
    // temp - single
    this.saveResourceJson("Users", this.mainParams["Users"]);
    this.executeCommand("gen generateResourceDescription");

    // final - all
    // Object.entries(this.mainParams).forEach(
    //   ([resourceName, resourceObject]) => {
    //     this.saveResourceJson(resourceName, resourceObject);
    //     this.executeCommand("gen generateResourceDescription");
    //     // this.deleteResourceJson();
    //   }
    // );
  }

  private saveResourceJson(resourceName: string, resourceObject: Resource) {
    writeFileSync(
      this.resourcePath,
      JSON.stringify({ resourceName, resourceObject }, null, 2),
      "utf8"
    );
  }
}
