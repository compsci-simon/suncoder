import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
} from "@mui/material";
import React from "react";
import { FormProps } from "react-final-form";
import { FieldArray } from "react-final-form-arrays";
import { connect } from "react-redux";
import FilterChipBox from "../../components/util/FilterChipBox";
import { selectors } from "../../orm/orm";
import { RootState } from "../../store";

const ImportsComponent = (props: any) => {
  const formProps: FormProps = props.formProps;
  if (!formProps) return null;
  return (
    <FormControl fullWidth>
      <FormLabel>Allowed imports</FormLabel>
      <FieldArray name="allowed_imports">
        {({ fields }) => {
          return (
            <FilterChipBox
              allItems={props.imports}
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

const mapStateToProps = (state: RootState) => {
  return { imports: selectors.imports(state) };
};

export default connect(mapStateToProps, {})(ImportsComponent);
