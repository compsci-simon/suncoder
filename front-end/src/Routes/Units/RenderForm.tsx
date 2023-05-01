import Stepper from "../../components/stepper/Stepper";
import React, { useEffect, useState } from "react";
import { FormProps } from "react-final-form";
import GeneralStep from "./GeneralStep";
import PoolsStep from "./PoolsStep";
import SpecifyFlow from "./SpecifyFlow";

const RenderForm = (props: any) => {
  const formProps: FormProps = props.formProps;
  const setUsePools = (_: any, checked: boolean) => {
    if (formProps.form) {
      let questions = formProps.values.questions;
      for (let i = 0; i < formProps.values.pools.length; i++) {
        formProps.form.mutators.pop("pools");
      }
      if (!checked) {
        for (let i = 0; i < questions.length; i++) {
          formProps.form.mutators.push("pools", {
            id: `${i}`,
            poolnum: i,
            questions: [questions[i]],
            prerequisites: [],
          });
        }
      } else {
        formProps.form.mutators.push("pools", {
          id: "0",
          questions: [],
          prerequisites: [],
        });
      }
    }
  };

  let steps = [
    {
      label: "General",
      canSkip: false,
      fields: ["name"],
      node: (
        <GeneralStep
          all_questions={props.questions}
          setUsePools={setUsePools}
          formProps={formProps}
        />
      ),
    },
  ];
  if (formProps.values.usePools) {
    steps = [
      {
        label: "General",
        canSkip: false,
        fields: ["name", "numPools"],
        node: (
          <GeneralStep
            all_questions={props.questions}
            setUsePools={setUsePools}
            formProps={formProps}
          />
        ),
      },
      {
        label: "Describe pools",
        canSkip: false,
        fields: ["pools"],
        node: <PoolsStep formProps={formProps} />,
      },
      {
        label: "Pool hierarchy",
        canSkip: false,
        fields: ["cycle"],
        node: <SpecifyFlow formProps={formProps} />,
      },
    ];
  }

  return (
    <form
      onSubmit={formProps.handleSubmit}
      style={{ height: "100%", paddingTop: 10 }}
    >
      <Stepper
        sx={{ height: "100%" }}
        steps={steps}
        formProps={formProps}
        setFieldTouched={(x1: object, x2: object) => {}}
      />
    </form>
  );
};

export default RenderForm;
