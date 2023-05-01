import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
} from "@mui/material";
import React from "react";
import { FieldArray } from "react-final-form-arrays";
import FilterChipBox from "../../components/util/FilterChipBox";

const OPERATORS = [
  { name: "and" },
  { name: "or" },
  { name: "+" },
  { name: "-" },
  { name: "*" },
  { name: "@" },
  { name: "/" },
  { name: "%" },
  { name: "**" },
  { name: "<<" },
  { name: ">>" },
  { name: "|" },
  { name: "^" },
  { name: "&" },
  { name: "//" },
  { name: "~" },
  { name: "!" },
  { name: "==" },
  { name: "!=" },
  { name: "<" },
  { name: "<=" },
  { name: ">" },
  { name: ">=" },
  { name: "is" },
  { name: "is not" },
  { name: "in" },
  { name: "not in" },
];
const OperatorsStep = () => {
  return (
    <FormControl>
      <FormLabel>Allowed operators</FormLabel>
      <FieldArray name="operators">
        {({ fields }) => {
          return (
            <FilterChipBox
              allItems={OPERATORS}
              selectedItems={fields.value}
              selectItem={fields.push}
              deselectItem={fields.remove}
              id_key="name"
            />
          );
        }}
      </FieldArray>
    </FormControl>
  );
};

export default OperatorsStep;
