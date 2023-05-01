import React, { useState } from "react";
import {
  Stepper as MuiStepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Mutator } from "final-form";

type StepperProps = {
  steps: {
    label: string;
    canSkip: boolean;
    fields: string[];
    node: React.ReactNode;
  }[];
  formProps: any;
  setFieldTouched?: Mutator<object, object>;
  hideNav?: boolean;
};

const Stepper = (props: StepperProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [skipped, setSkipped] = useState(new Set<number>());

  const isStepOptional = (step: number) => {
    return props.steps[step].canSkip;
  };

  const isStepSkipped = (step: number) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    for (let field of props.steps[activeStep].fields!) {
      if (props.formProps.errors[field]) {
        if (Array.isArray(props.formProps.values[field])) {
          props.formProps.values[field].forEach((item: any, index: number) => {
            Object.keys(item).forEach((key: string) => {
              props.formProps.form.mutators.setFieldTouched(
                `${field}[${index}].${key}`,
                true
              );
            });
          });
        } else {
          props.formProps.form.mutators.setFieldTouched(field, true);
        }
        return;
      }
    }
    if (activeStep === props.steps.length - 1) {
      props.formProps.handleSubmit();
      return;
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <MuiStepper activeStep={activeStep}>
        {props.steps.map((step, index) => {
          const stepProps: { completed?: boolean } = {};
          const labelProps: {
            optional?: React.ReactNode;
          } = {};
          if (isStepOptional(index)) {
            labelProps.optional = (
              <Typography variant="caption">Optional</Typography>
            );
          }
          if (isStepSkipped(index)) {
            stepProps.completed = false;
          }
          return (
            <Step key={step.label} {...stepProps}>
              <StepLabel {...labelProps}>{step.label}</StepLabel>
            </Step>
          );
        })}
      </MuiStepper>
      {/* Step content */}
      <div
        style={{ flexGrow: 2, position: "relative" }}
        className="overflow-box"
      >
        <div
          style={{ position: "absolute", width: "100%", height: "100%" }}
          className="p-3"
        >
          {props.steps[activeStep] && props.steps[activeStep].node}
        </div>
      </div>

      {/* Back, Next and Skip buttons */}
      <Stack
        direction="row"
        justifyContent="space-between"
        sx={{ borderTop: 1, borderColor: "divider", pt: 1 }}
      >
        <Button
          color="inherit"
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{ ml: 1, mb: 1 }}
        >
          Back
        </Button>
        {!props.hideNav && (
          <Stack direction="row">
            {activeStep === props.steps.length - 1 ? (
              <Button onClick={handleNext} sx={{ mr: 1, mb: 1 }}>
                Finish
              </Button>
            ) : (
              <Button onClick={handleNext} type="button" sx={{ mr: 1, mb: 1 }}>
                Next
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </div>
  );
};

const StepperSx = styled(Stepper, { name: "MyStepper", slot: "root" })({});

export default StepperSx;
