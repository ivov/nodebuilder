export class ImportsBuilder {
  serviceApiRequest: string;
  hasGetAll = false;

  constructor(serviceApiRequest: string, mainParams: MainParams) {
    this.serviceApiRequest = serviceApiRequest;
    this.checkIfGetAllExists(mainParams);
  }

  checkIfGetAllExists(mainParams: MainParams) {
    Object.values(mainParams).forEach((operationsBundle) => {
      for (const operation of operationsBundle) {
        if (operation.operationId === "getAll") {
          this.hasGetAll = true;
          break;
        }
      }
    });
  }

  genericFunctionsImports() {
    return this.hasGetAll
      ? [this.serviceApiRequest, "handleListing"]
          .sort()
          .map((imported) => "\t" + imported + ",")
          .join("\n")
      : this.serviceApiRequest + ",";
  }
}
