import { camelCase } from "change-case";

export class BranchBuilder {
  mainParams: MainParams;
  resourceTuples: ResourceTuples;
  resourceNames: string[];

  constructor(mainParams: MainParams) {
    this.mainParams = mainParams;
    this.resourceTuples = Object.entries(this.mainParams);
    this.resourceNames = this.resourceTuples.map((tuple) => tuple[0]);
    return this;
  }

  isFirst = <T>(item: T, array: T[]) => array.indexOf(item) === 0;

  isLast = <T>(item: T, array: T[]) => array.indexOf(item) + 1 === array.length;

  resourceBranch(resourceName: string) {
    const branch = `if (resource === '${camelCase(resourceName)}') {`;
    const prefix = "} else ";
    const isFirst = this.isFirst(resourceName, this.resourceNames);

    return isFirst ? branch : prefix + branch;
  }

  operationBranch(resourceName: string, operation: Operation) {
    const branch = `if (operation === '${camelCase(operation.operationId)}') {`;
    const prefix = "} else ";
    const isFirst = this.isFirst(operation, this.mainParams[resourceName]);

    return isFirst ? branch : prefix + branch;
  }

  resourceError(resourceName: string, { enabled }: { enabled: boolean }) {
    if (!enabled) return "\t}\n";

    const isLast = this.isLast(resourceName, this.resourceNames);
    const resourceError = `
    \t} else {
    \t\tthrow new Error(\`Unknown resource: \${resource}\`);
    \t}`;

    return isLast ? resourceError : null;
  }

  operationError(
    resourceName: string,
    operation: Operation,
    { enabled }: { enabled: boolean }
  ) {
    if (!enabled) return null;

    const isLast = this.isLast(operation, this.mainParams[resourceName]);
    const operationError = `
    \t\t} else {
    \t\t\tthrow new Error(\`Unknown operation: \${operation}\`);
    \t\t}`;

    return isLast ? operationError : null;
  }
}
