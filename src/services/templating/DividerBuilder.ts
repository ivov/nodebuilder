export class DividerBuilder {
  /**  Build a comment divider for a resource:
   * ```
   * // **********************************************************************
   * //                               user
   * // **********************************************************************
   * ```*/
  resourceDivider(resourceName: string) {
    const RESOURCE_DIVIDER_LENGTH = 70;

    const padLength = Math.floor(
      (RESOURCE_DIVIDER_LENGTH - resourceName.length) / 2
    );

    const titleLine = "// " + " ".repeat(padLength) + resourceName;
    const dividerLine = "// " + "*".repeat(RESOURCE_DIVIDER_LENGTH);

    return [dividerLine, titleLine, dividerLine].join("\n" + "\t".repeat(4));
  }

  /**  Build a comment divider for an operation:
   * ```
   * // ----------------------------------------
   * //             user: getUser
   * // ----------------------------------------
   *
   * // https://api.service.com/api-docs-section
   * ```*/
  operationDivider(
    resourceName: string,
    operationId: string,
    operationUrl: string
  ) {
    const OPERATION_DIVIDER_LENGTH = 40;

    const title = `${resourceName}: ${operationId}`;
    const padLengthCandidate = Math.floor(
      (OPERATION_DIVIDER_LENGTH - title.length) / 2
    );
    const padLength = padLengthCandidate > 0 ? padLengthCandidate : 0;

    const titleLine = "// " + " ".repeat(padLength) + title;
    const dividerLine = "// " + "-".repeat(OPERATION_DIVIDER_LENGTH);

    let operationDivider = [dividerLine, titleLine, dividerLine];

    if (operationUrl) {
      operationDivider.push("\n" + "\t".repeat(5) + "// " + operationUrl);
    }

    return operationDivider.join("\n" + "\t".repeat(5));
  }

  resourceDescriptionDivider(resourceName: string, operationId: string) {
    const OPERATION_DIVIDER_LENGTH = 40;

    const title = `${resourceName}: ${operationId}`;
    const padLengthCandidate = Math.floor(
      (OPERATION_DIVIDER_LENGTH - title.length) / 2
    );
    const padLength = padLengthCandidate > 0 ? padLengthCandidate : 0;

    const titleLine = "// " + " ".repeat(padLength) + title;
    const dividerLine = "// " + "-".repeat(OPERATION_DIVIDER_LENGTH);

    let resourceOperation = [dividerLine, titleLine, dividerLine];

    return resourceOperation.join("\n" + "\t");
  }
}
