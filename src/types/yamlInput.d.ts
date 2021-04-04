// ----------------------------------
//         Input YAML file
// ----------------------------------

// Only to validate the shape of the input YAML file.

type YamlInput = {
  metaParams: MetaParams;
  mainParams: {
    [resource: string]: Array<{
      endpoint: string;
      operationId: string;
      requestMethod: string;

      operationUrl?: string;
      requiredFields?: Field;
      additionalFields?: Field;
      filters?: Field;
      updateFields?: Field;
    }>;
  };
};

type Field = {
  queryString?: UnadjustedNameTypeAndDescription;
  requestBody?: UnadjustedNameTypeAndDescription;
};

type UnadjustedNameTypeAndDescription = {
  [name: string]: string | object;
};
