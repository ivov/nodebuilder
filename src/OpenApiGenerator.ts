import { execSync as exec } from "child_process";

export default class OpenApiNodeGenerator {
  private nodeGenerationType: keyof typeof NodeGenerationType;

  constructor(nodeGenerationType: keyof typeof NodeGenerationType) {
    this.nodeGenerationType = nodeGenerationType;
  }

  /**Generates all node functionality files: `*.node.ts`, `GenericFunctions.ts`, `*.credentials.ts`, and (in complex mode) one `*Description.ts` file per resource.*/
  public run() {
    this.executeCommand("gen whoa");
    // this.generateGenericFunctionsFile();

    // if (this.isComplexNodeGenerationType()) {
    // this.generateResourceDescriptionFile();
    // }

    // if (this.metaParams.authType !== AuthType.None) {
    //   this.generateCredentialsFile();
    // }
  }

  private executeCommand(command: string) {
    return exec(
      `env HYGEN_OVERWRITE=1 node node_modules/hygen/dist/bin.js ${command}`
    );
  }
}
