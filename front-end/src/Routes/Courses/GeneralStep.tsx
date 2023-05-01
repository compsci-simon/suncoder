import { FormLabel, Stack } from "@mui/material";
import { TextField } from "mui-rff";
import React from "react";
import { FieldArray } from "react-final-form-arrays";
import FilterChipBox from "../../components/util/FilterChipBox";
import _ from "lodash";
import { values } from "underscore";

const GeneralStep = (props: any) => {
  return (
    <Stack spacing={2}>
      <TextField label="Course name" name="name" autoComplete="off" />
      <FormLabel>Prerequisites</FormLabel>
      <FieldArray name="prerequisites">
        {({ fields, meta }) => {
          let err_msg = "";
          if (meta.error) {
            err_msg = `Cyclic dependency`;
          }
          return (
            <FilterChipBox
              selectItem={fields.push}
              deselectItem={fields.remove}
              selectedItems={fields.value ? fields.value : []}
              allItems={Object.values(props.courses_to_show)}
              error={meta.error}
              error_msg={err_msg}
              id_key="id"
            />
          );
        }}
      </FieldArray>
      <FormLabel>Units</FormLabel>
      <FieldArray name="units">
        {({ fields }) => {
          console.log(fields);
          return (
            <FilterChipBox
              selectItem={(value: any) => {
                value.course_id = props.formProps.values.id;
                let copy = _.cloneDeep(value);
                copy.course_id = props.course!.id;
                let val = fields.value;
                if (val.length > 0) {
                  copy.prerequisites = [{ id: val[val.length - 1].id }];
                }
                fields.push(copy);
              }}
              deselectItem={(index: number) => {
                let values = fields.value;
                let id = values[index].id;
                for (let i = 0; i < values.length; i++) {
                  if (i == index) continue;
                  let clone = { ...values[i] };
                  clone.prerequisites = clone.prerequisites.filter(
                    (prereq: any) => {
                      return prereq.id != id;
                    }
                  );
                  fields.update(i, clone);
                }
                if (index + 1 < values.length && index - 1 >= 0) {
                  let next_item = values[index + 1];
                  let prev_item = values[index - 1];
                  next_item.prerequisites = [{ id: prev_item.id }];
                }
                fields.remove(index);
              }}
              selectedItems={fields.value ? fields.value : []}
              allItems={Object.values(props.units)}
              id_key="id"
            />
          );
        }}
      </FieldArray>
    </Stack>
  );
};

export default GeneralStep;
