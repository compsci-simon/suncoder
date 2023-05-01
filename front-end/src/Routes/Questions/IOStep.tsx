import { Button, FormHelperText, FormLabel, Stack } from "@mui/material";
import { TextField } from "mui-rff";
import React from "react";
import { FormProps } from "react-final-form";
import { FieldArray } from "react-final-form-arrays";
import { get_data_type } from "./helper";

const ioValdation = (values: any) => {
  if (!values) return;
  let found = false;
  let errors = values.map((io: any) => {
    let obj: any = {};
    if (io.input == "" && typeof (io.input == "string")) {
      found = true;
      obj["input"] = "Input cannot be empty";
    }
    if (io.output == "") {
      found = true;
      obj["output"] = "Output cannot be empty";
    }
    return obj;
  });

  if (found) {
    return errors;
  }
};

const IOStep = (props: any) => {
  const formProps: FormProps = props.formProps;
  if (!formProps) return null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: 15,
      }}
    >
      <FormLabel>Inputs and expected outputs</FormLabel>
      {/* BUTTONS TO ADD OR DELETE */}
      <FieldArray name="input_outputs" validate={ioValdation}>
        {({ fields }) => {
          return (
            <div
              style={{
                flexGrow: 2,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    fields.push({ input: "", output: "" });
                  }}
                >
                  Add
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    if (fields.length) {
                      if (fields.length > 1) fields.pop();
                    }
                  }}
                >
                  Remove
                </Button>
              </Stack>
              <div
                style={{
                  flexGrow: 2,
                  position: "relative",
                }}
              >
                {fields.map((item: any, index: number) => {
                  return (
                    <div key={index}>
                      <FormLabel>test_{index}</FormLabel>
                      <Stack direction="row" spacing={3}>
                        <Stack sx={{ width: "100%" }}>
                          <TextField
                            label="Input"
                            name={`${item}.input`}
                            autoComplete="off"
                          />
                          <FormHelperText>
                            {get_data_type(
                              formProps.values.input_outputs[index].input
                            )}
                          </FormHelperText>
                        </Stack>

                        <Stack sx={{ width: "100%" }}>
                          <TextField
                            label="Output"
                            name={`${item}.output`}
                            autoComplete="off"
                          />
                          <FormHelperText>
                            {get_data_type(
                              formProps.values.input_outputs[index].output
                            )}
                          </FormHelperText>
                        </Stack>
                      </Stack>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }}
      </FieldArray>
    </div>
  );
};

export default IOStep;
