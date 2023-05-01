import React, { useRef } from "react";
import Editor from "@monaco-editor/react";
import { MutableState, Mutator, Tools } from "final-form";
import { connect } from "react-redux";
import { Field, Form as FinalForm } from "react-final-form";
import arrayMutators from "final-form-arrays";
import setFieldTouched from "final-form-set-field-touched";

import { lint } from "../ide/actions";
import "./question.css";
import Stepper from "../../components/stepper/Stepper";
import "katex/dist/katex.min.css";
import DescriptionStep from "./DescriptionStep";
import IOStep from "./IOStep";
import MetadataStep from "./MetadataStep";
import Samples from "./Samples";

const setDescription: Mutator = (
  args: any,
  state: MutableState<any, any>,
  tools: Tools<any, any>
) => {
  tools.changeValue(state, "description", () => args[0]);
};

const QuestionEditor = (props: any) => {
  const editorCount = useRef(0);
  editorCount.current++;

  const validation = (question: any) => {
    let errors: any = {};
    if (!question.name) {
      errors["name"] = "Question requires a valid name";
    }
    if (!question.timeout) {
      errors["timeout"] = "Timeout is required";
    }
    if (isNaN(question.timeout)) {
      errors["timeout"] = "Timeout must be an integer value";
    } else {
      let i = parseInt(question.timeout);
      if (i < 1) {
        errors["timeout"] = "Timeout must be greater than 0";
      }
    }
    return errors;
  };

  return (
    <FinalForm
      onSubmit={props.handleSubmit}
      mutators={{
        ...arrayMutators,
        setFieldTouched,
        setDescription,
      }}
      validate={validation}
      initialValues={{
        ...props.question,
      }}
      render={(formProps: any) => (
        <form
          onSubmit={formProps.handleSubmit}
          style={{ height: "100%", paddingTop: 10 }}
        >
          <Stepper
            sx={{ height: "100%" }}
            steps={[
              {
                label: "Prompt",
                canSkip: false,
                fields: ["name"],
                node: <DescriptionStep formProps={formProps} />,
              },
              {
                label: "Metadata",
                canSkip: false,
                fields: [],
                node: <MetadataStep formProps={formProps} />,
              },
              {
                label: "Inputs and Outputs",
                canSkip: false,
                fields: ["input_outputs"],
                node: <IOStep formProps={formProps} />,
              },
              {
                label: "Samples",
                canSkip: false,
                fields: ["sample_solutions"],
                node: <Samples formProps={formProps} />,
              },
              {
                label: "Template",
                canSkip: false,
                fields: [],
                node: (
                  <div style={{ padding: 15 }}>
                    <div className="border mt-3">
                      <Field name="template">
                        {(props) => {
                          return (
                            <Editor
                              className="border-bottom"
                              height="60vh"
                              defaultLanguage="python"
                              theme="light"
                              options={{
                                fontSize: 16,
                              }}
                              value={props.input.value}
                              onChange={props.input.onChange}
                            />
                          );
                        }}
                      </Field>
                    </div>
                  </div>
                ),
              },
            ]}
            formProps={formProps}
            setFieldTouched={setFieldTouched}
          />
        </form>
      )}
    />
  );
};

export default connect(null, {
  lint,
})(QuestionEditor);
