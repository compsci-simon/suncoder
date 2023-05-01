import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  Stack,
} from "@mui/material";
import React from "react";
import { FormProps } from "react-final-form";
import { FieldArray } from "react-final-form-arrays";
import { connect } from "react-redux";
import { selectors } from "../../orm/orm";
import { RootState } from "../../store";

const StructuresComponent = (props: any) => {
  const formProps: FormProps = props.formProps;
  if (!formProps) return null;
  return (
    <FormControl>
      <FormLabel>Required Structure</FormLabel>
      <FieldArray name="required_structures">
        {({ fields }) => {
          return props.structures.map((structure: any) => {
            const checked = fields.value
              .map((x: any) => x.name)
              .includes(structure.name);
            return (
              <FormControlLabel
                key={structure.name}
                control={
                  <Checkbox
                    checked={checked ? true : false}
                    onClick={() => {
                      if (checked) {
                        fields.value.map((item: any, index: number) => {
                          if (item.name == structure.name) {
                            fields.remove(index);
                          }
                        });
                      } else {
                        fields.push(structure as never);
                      }
                    }}
                  />
                }
                label={structure.name}
              />
            );
          });
        }}
      </FieldArray>
      <FormLabel>Illegal Structure</FormLabel>
      <FieldArray name="illegal_structures">
        {({ fields }) => {
          return props.structures.map((structure: any) => {
            const checked = fields.value
              .map((x: any) => x.name)
              .includes(structure.name);
            return (
              <FormControlLabel
                key={structure.name}
                checked={checked ? true : false}
                control={
                  <Checkbox
                    onClick={() => {
                      if (checked) {
                        fields.value.map((struct: any, index: number) => {
                          if (struct.name === structure.name) {
                            fields.remove(index);
                          }
                        });
                      } else {
                        fields.push(structure as never);
                      }
                    }}
                  />
                }
                label={structure.name}
              />
            );
          });
        }}
      </FieldArray>
    </FormControl>
  );
};

const mapStateToProps = (state: RootState) => {
  return { structures: selectors.structures(state) };
};

export default connect(mapStateToProps, {})(StructuresComponent);
