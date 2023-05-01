import { FormControl, FormLabel } from "@mui/material";
import { Checkboxes } from "mui-rff";
import React from "react";
import { TextField } from "mui-rff";

const Other = () => {
  return (
    <FormControl>
      <Checkboxes
        name="linting"
        data={{ label: "Enable syntax highlighting", value: true }}
      />
      <FormLabel>Specify question timeout</FormLabel>
      <TextField label="Timeout(s)" name="timeout" required={true} />
    </FormControl>
  );
};

export default Other;
