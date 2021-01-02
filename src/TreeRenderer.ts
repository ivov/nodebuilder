import treeify from "object-treeify";
import { JSONPath as jsonQuery } from "jsonpath-plus";

export default class TreeRenderer {
  constructor(
    private readonly viewable: MainParams,
    private readonly json: any
  ) {}

  public run() {
    this.prepareTreeView();
    return this.generateTreeView();
  }

  /**Hide wordy descriptions and convert arrays into objects.*/
  private prepareTreeView() {
    for (const [resource, operations] of Object.entries(this.viewable)) {
      operations.forEach((op) => {
        this.hideProperty(op, "description");
        if (op.parameters) this.objectifyProperty(op, "parameters");
        if (op.requestBody) this.objectifyProperty(op, "requestBody");
      });

      this.objectifyOperations(operations, resource);
    }
  }

  private hideProperty(object: Operation, property: string) {
    Object.defineProperty(object, property, { enumerable: false });
  }

  /**Convert the array in `parameters` or `requestBody` into an object with numbered keys.*/
  private objectifyProperty(operation: Operation, property: string) {
    operation[property] = Object.assign({}, operation[property]);
  }

  /**Convert the array of operations into an object with numbered keys.*/
  private objectifyOperations(operations: Operation[], resource: string) {
    this.viewable[resource] = Object.assign({}, operations);
  }

  private generateTreeView() {
    return this.getTitle() + "\n" + treeify(this.viewable);
  }

  private getTitle() {
    return jsonQuery({ json: this.json, path: `$.servers.*.url` });
  }
}
