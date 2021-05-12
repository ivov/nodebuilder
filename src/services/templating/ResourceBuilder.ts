import { camelCase, capitalCase } from "change-case";

export default class ResourceBuilder {
  lines: string[] = [];

  public operationsOptions(operations: Operation[]) {
    operations.forEach(({ operationId, description }, index) => {
      this.createLine("{", { tabs: !index ? 0 : 3 });

      this.createLine(`name: '${capitalCase(operationId)}',`, { tabs: 4 });
      this.createLine(`value: '${camelCase(operationId)}',`, { tabs: 4 });
      if (description) {
        this.createLine(`description: '${description}',`, { tabs: 4 });
      }

      this.createLine("},", { tabs: 3 });
    });

    return this.lines.join("\n");
  }

  private createLine(line: string, { tabs }: { tabs: number } = { tabs: 0 }) {
    if (!tabs) {
      this.lines.push(line);
      return;
    }

    this.lines.push("\t".repeat(tabs) + line);
  }

  public getAllAdditions(resourceName: string, operationId: string) {
    return [
      this.returnAll(resourceName, operationId),
      this.limit(resourceName, operationId),
    ].join("\n\t");
  }

  private returnAll(resourceName: string, operationId: string) {
    const returnAll = `
    {
      displayName: 'Return All',
      name: 'returnAll',
      type: 'boolean',
      default: false,
      description: 'Return all results.',
      displayOptions: {
        show: {
          resource: [
            '${resourceName}',
          ],
          operation: [
            '${operationId}',
          ],
        },
      },
    },
    `;

    return this.adjustCodeToTemplate(returnAll);
  }

  private limit(resourceName: string, operationId: string) {
    const limit = `
    {
      displayName: 'Limit',
      name: 'limit',
      type: 'number',
      default: 50,
      description: 'The number of results to return.',
      typeOptions: {
        minValue: 1,
      },
      displayOptions: {
        show: {
          resource: [
            '${resourceName}',
          ],
          operation: [
            '${operationId}',
          ],
          returnAll: [
            false,
          ],
        },
      },
    },
    `;

    return this.adjustCodeToTemplate(limit);
  }

  private adjustCodeToTemplate(property: string) {
    return property
      .trimLeft()
      .replace(/^[ ]{2}/gm, "")
      .replace(/[ ]{2}/gm, "\t")
      .trimRight();
  }

  private hasMinMax = (arg: any) => arg.minimum && arg.maximum;
}
