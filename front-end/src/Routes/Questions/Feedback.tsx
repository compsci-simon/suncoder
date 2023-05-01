import React from "react";
import { Checkboxes } from "mui-rff";
import { FormControl, FormLabel } from "@mui/material";

const Feedback = () => {
  return (
    <FormControl>
      <FormLabel>Specify output options</FormLabel>
      <Checkboxes name="stdout" data={{ label: "Stdout", value: true }} />
      <Checkboxes name="stderr" data={{ label: "Stderr", value: true }} />
    </FormControl>
  );
};

export default Feedback;
