import { FormControl, FormLabel, Stack, Switch } from "@mui/material";
import React, { useState } from "react";
import { Switches, TextField } from "mui-rff";
import FilterChipBox from "../../components/util/FilterChipBox";
import CategoriesComponent from "../Questions/CategoriesComponent";

const GeneralStep = (props: any) => {
  const [numPools, _setNumPools] = useState(1);
  const formProps = props.formProps;

  // const setNumPools = (value: any) => {
  //   if (!value || isNaN(value)) {
  //     _setNumPools(value);
  //     return;
  //   } else {
  //     value = parseInt(value);
  //   }
  //   for (let i = 0; i < formProps.values.pools.length; i++) {
  //     formProps.form.mutators.pop("pools");
  //   }
  //   _setNumPools(value);
  //   for (let i = 0; i < value; i++) {
  //     let prereqs: { id: string }[] = [];
  //     if (i > 0) {
  //       prereqs = [{ id: formProps.values.pools[i - 1].id }];
  //     }
  //     formProps.form.mutators.push("pools", {
  //       id: crypto.randomUUID().replaceAll("-", ""),
  //       poolnum: i,
  //       name: `Pool ${i + 1}`,
  //       questions: [],
  //       prerequisites: prereqs,
  //     });
  //   }
  // };

  if (!formProps) return null;
  return (
    <FormControl fullWidth>
      <Stack spacing={1}>
        <TextField name="name" label="Unit name" autoComplete="off" />
        <FormLabel focused={false}>Select categories</FormLabel>

        <CategoriesComponent />

        <FormLabel focused={false}>Select question set</FormLabel>
        <FilterChipBox
          id_key="id"
          allItems={props.all_questions}
          selectedItems={formProps.values.questions}
          selectItem={(value) => {
            formProps.form.mutators.push("questions", value);
            if (!formProps.values.usePools) {
              let numPools = formProps.values.questions.length;
              formProps.form.mutators.push("pools", {
                id: crypto.randomUUID().replaceAll("-", ""),
                poolnum: numPools,
                prerequisites: [],
                questions: [value],
              });
            }
          }}
          deselectItem={(index) => {
            let pools = formProps.values.pools;
            let questions = formProps.values.questions;
            formProps.form.mutators.remove("questions", index);
            if (formProps.values.usePools) {
              formProps.form.mutators.setNumPools(
                Math.min(pools.length, questions.length - 1)
              );
            } else {
              formProps.form.mutators.remove("pools", index);
            }
          }}
        />

        <FormLabel focused={false}>Use Question Pools</FormLabel>
        <Switches name="usePools" data={{ label: "Use Pools", value: false }} />
        {formProps.values.usePools && (
          <>
            <FormLabel>Specify number of pools</FormLabel>
            <TextField
              label="Number of pools"
              name="numPools"
              autoComplete="off"
              onChangeCapture={(e) =>
                formProps.form.mutators.setNumPools(e.target.value, formProps)
              }
            />
          </>
        )}
      </Stack>
    </FormControl>
  );
};

export default GeneralStep;
