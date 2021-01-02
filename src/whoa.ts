const content = {
  "application/x-www-form-urlencoded": {
    schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description:
            "The tournament name. Leave empty to get a random Grandmaster name",
        },
      },
    },
  },
};

Object.values(content).forEach((mimeTypeObj) =>
  Object.keys(mimeTypeObj.schema.properties).forEach((prop) =>
    console.log(prop)
  )
);
