export const DividerBuilder = {
  mainParams: <MainParams>{},
  resourceTuples: <[string, Resource][]>[],
  dividerLength: 0,

  constructor: function (resourceTuples: [string, Resource][]) {
    this.resourceTuples = resourceTuples;
    this.dividerLength = this.getDividerLength();
    return this;
  },

  getDividerLength: function () {
    let maxTitleLength = 0;

    this.resourceTuples.forEach(([resourceName, operationsArray]) => {
      operationsArray.forEach((operation) => {
        const title = `${resourceName}: ${operation.operationId}`;
        maxTitleLength =
          title.length > maxTitleLength ? title.length : maxTitleLength;
      });
    });

    return maxTitleLength + 20;
  },

  /**  Build a divider for a resource:
   * ```
   * // **************************************************************
   * //                            user
   * // **************************************************************
   * ```*/
  resourceDivider: function (resourceName: string) {
    const longDividerLength = this.dividerLength + 20;

    const padLength = Math.floor((longDividerLength - resourceName.length) / 2);

    const titleLine = "// " + " ".repeat(padLength) + resourceName;
    const dividerLine = "// " + "*".repeat(longDividerLength);

    return [dividerLine, titleLine, dividerLine].join("\n" + "\t".repeat(4));
  },

  /**  Build a divider for an operation:
   * ```
   * // ----------------------------------------
   * //             user: getUser
   * // ----------------------------------------
   * ```*/
  operationDivider: function (resourceName: string, operationId: string) {
    const title = `${resourceName}: ${operationId}`;
    const padLength = Math.floor((this.dividerLength - title.length) / 2);

    const titleLine = "// " + " ".repeat(padLength) + title;
    const dividerLine = "// " + "-".repeat(this.dividerLength);

    return [dividerLine, titleLine, dividerLine].join("\n" + "\t".repeat(5));
  },
};
