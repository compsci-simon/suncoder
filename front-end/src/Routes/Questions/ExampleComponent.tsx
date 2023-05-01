import { Button, FormLabel, Stack } from "@mui/material";
import { TextField } from "mui-rff";
import React from "react";
import { FieldArray } from "react-final-form-arrays";

const examplesValidation = (values: any) => {
  if (!values.length) return;
  let found = false;
  let errors = values.map(
    (example: { input: String; output: string; explanation: string }) => {
      let obj: any = {};
      if (!example.input) {
        found = true;
        obj["input"] = "input required";
      }
      if (!example.output) {
        found = true;
        obj["output"] = "output required";
      }
      return obj;
    }
  );

  if (found) return errors;
};

const ExampleComponent = () => {
  return (
    <FieldArray name="examples" validate={examplesValidation}>
      {({ fields }) => {
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              padding: 15,
            }}
          >
            <FormLabel>Add Examples to your question</FormLabel>
            <Stack spacing={2} direction="row">
              <Button
                variant="outlined"
                onClick={() =>
                  fields.push({
                    input: "",
                    output: "",
                    explanation: "",
                  })
                }
              >
                Add
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  fields.pop();
                }}
                color="error"
              >
                Remove
              </Button>
            </Stack>
            <div
              style={{
                flexGrow: 2,
                position: "relative",
                paddingTop: 10,
              }}
            >
              {fields.map((example: any, index: number) => {
                return (
                  <div key={index}>
                    <FormLabel>Example {index + 1}</FormLabel>
                    <Stack spacing={1} sx={{ width: "100%", height: "100%" }}>
                      <Stack spacing={2} direction="row">
                        <TextField
                          label="Input"
                          name={`${example}.input`}
                          fullWidth
                        />
                        <TextField
                          label="Output"
                          name={`${example}.output`}
                          fullWidth
                        />
                      </Stack>
                      <TextField
                        label="Explanation"
                        name={`${example}.explanation`}
                        fullWidth
                      />
                    </Stack>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }}
    </FieldArray>
  );
};

export default ExampleComponent;
