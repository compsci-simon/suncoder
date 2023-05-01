import {
  Chip,
  FormControl,
  FormLabel,
  Grid,
  Paper,
  Stack,
  TextField,
} from "@mui/material";
import React, { useState } from "react";
import { FieldArray } from "react-final-form-arrays";

const CallsStep = (props: any) => {
  const [value, setValue] = useState<any>("");
  const calls = (fields: any) =>
    props.calls.map((call: string) => {
      const checked = fields.value.includes(call);
      return <Grid item xs={2}></Grid>;
    });

  const keypress = (e: any, fields: any) => {
    if (e.keyCode == 13 && value) {
      e.preventDefault();
      if (!fields.value.includes(value)) {
        fields.push(value);
      }
      setValue("");
    }
  };

  const deleteChip = (call_tag: string, fields: any) => {
    fields.remove(fields.value.indexOf(call_tag));
  };

  return (
    <FormControl fullWidth>
      <FormLabel>Callable functions</FormLabel>
      <FieldArray name="calls">
        {({ fields }) => {
          return (
            <Stack spacing={2}>
              <TextField
                label="Function name"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                fullWidth
                onKeyDown={(e: any) => keypress(e, fields)}
                autoComplete="off"
              />
              <Paper
                elevation={0}
                variant="outlined"
                className="mt-3 p-1"
                style={{
                  minHeight: "58px",
                  height: "100%",
                  maxHeight: "250px",
                  overflowY: "scroll",
                }}
              >
                {fields.value.map((call_tag: string) => {
                  return (
                    <Chip
                      key={call_tag}
                      label={call_tag}
                      className="m-1"
                      onDelete={(e) => deleteChip(call_tag, fields)}
                    />
                  );
                })}
              </Paper>
            </Stack>
          );
        }}
      </FieldArray>
    </FormControl>
  );
};

export default CallsStep;
