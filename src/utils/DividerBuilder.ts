export class DividerBuilder {
  // private resourceTuples: ResourceTuples = [];
  // private dividerLength = 0;

  // constructor(resourceTuples: ResourceTuples) {
  //   this.resourceTuples = resourceTuples;
  //   // this.dividerLength = this.getDividerLength();
  //   return this;
  // }

  // getDividerLength() {
  //   let maxTitleLength = 0;

  //   this.resourceTuples.forEach(([resourceName, operationsArray]) => {
  //     operationsArray.forEach((operation) => {
  //       const title = `${resourceName}: ${operation.operationId}`;
  //       maxTitleLength =
  //         title.length > maxTitleLength ? title.length : maxTitleLength;
  //     });
  //   });

  //   return maxTitleLength + 20;
  // }

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
   * ```*/
  operationDivider(resourceName: string, operationId: string) {
    const OPERATION_DIVIDER_LENGTH = 40;

    const title = `${resourceName}: ${operationId}`;
    const padLengthCandidate = Math.floor(
      (OPERATION_DIVIDER_LENGTH - title.length) / 2
    );
    const padLength = padLengthCandidate > 0 ? padLengthCandidate : 0;

    const titleLine = "// " + " ".repeat(padLength) + title;
    const dividerLine = "// " + "-".repeat(OPERATION_DIVIDER_LENGTH);

    return [dividerLine, titleLine, dividerLine].join("\n" + "\t".repeat(5));
  }
}
