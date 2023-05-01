import React from "react";
import { connect } from "react-redux";

import { selectors } from "../../orm/orm";
import { RootState } from "../../store";
import { Form as FinalForm } from "react-final-form";
import arrayMutators from "final-form-arrays";
import RenderForm from "./RenderForm";
import { poolCycles } from "../helper";
import setFieldTouched from "final-form-set-field-touched";
import { MutableState, Tools } from "final-form";

const setNumPools: (
  args: any[],
  state: MutableState<any>,
  tools: Tools<any>
) => void = (args, state, { setIn, changeValue }) => {
  let value = args[0];
  let formProps = args[1];
  if (!value || isNaN(value)) {
    state.fields["numPools"].change(value);
    return;
  } else {
    value = parseInt(value);
  }
  console.log("state", state);
  for (let i = 0; i < formProps.values.pools.length; i++) {
    formProps.form.mutators.pop("pools");
  }
  state.fields["numPools"].change(value);
  let prev_id = "";
  for (let i = 0; i < value; i++) {
    let prereqs: { id: string }[] = [];
    if (i > 0) {
      prereqs = [{ id: prev_id }];
    }
    prev_id = crypto.randomUUID().replaceAll("-", "");
    formProps.form.mutators.push("pools", {
      id: prev_id,
      poolnum: i,
      name: `Pool ${i + 1}`,
      questions: [],
      prerequisites: prereqs,
    });
  }
};

const validation = (values: any) => {
  if (!values) return {};
  let errors = {};
  if (!values.name) {
    errors["name"] = "Name is required";
  }

  let cycle = false;
  let pool_flag = false;
  if (
    !isNaN(values.numPools) &&
    parseInt(values.numPools) >= 1 &&
    parseInt(values.numPools) <= values.questions.length
  ) {
    cycle = poolCycles(values);
    for (let pool of values.pools) {
      if (pool.questions.length == 0) {
        pool_flag = true;
        if (errors["pools"] === undefined) {
          errors["pools"] = {
            [pool.poolnum]: `Pools needs at least one question`,
          };
        } else {
          errors["pools"][pool.poolnum] = `Pools need at least one question`;
        }
      }
    }
  } else if (values.usePools) {
    errors[
      "numPools"
    ] = `Valid number of pools between [1, ${values.questions.length}] required`;
  }
  if (cycle) {
    errors["cycle"] = true;
  }
  console.log("errors", errors);
  return errors;
};

const UnitEditor = (props: any) => {
  return (
    <FinalForm
      sx={{ height: "100%" }}
      onSubmit={props.submit}
      mutators={{ ...arrayMutators, setFieldTouched, setNumPools }}
      initialValues={{ ...props.unit }}
      validate={validation}
      render={(formProps) => {
        return (
          <RenderForm
            formProps={formProps}
            unit={props.unit}
            questions={props.questions}
          />
        );
      }}
    />
  );
};

const mapStateToProps = (state: RootState, ownProps: any) => {
  let shownQuestions: any[] = [];
  let questions = selectors.questions(state);
  let categories = selectors.categories(state);
  return {
    questions,
    shownQuestions,
    categories,
  };
};

export default connect(mapStateToProps, {})(UnitEditor);
