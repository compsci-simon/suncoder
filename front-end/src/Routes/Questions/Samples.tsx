import Editor from "@monaco-editor/react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Card,
  CardContent,
  Collapse,
  FormHelperText,
  FormLabel,
  IconButton,
  Stack,
  styled,
  Typography,
} from "@mui/material";
import React, { useRef } from "react";
import { FormProps } from "react-final-form";
import { FieldArray } from "react-final-form-arrays";
import { connect } from "react-redux";
import { lint, test_sample } from "./actions";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RadioButtonUncheckedTwoToneIcon from "@mui/icons-material/RadioButtonUncheckedTwoTone";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineTwoToneIcon from "@mui/icons-material/CheckCircleOutlineTwoTone";
import ResponseContent from "./ResponseContent";
const AUTOSAVE_DELAY = 500;
import store from "../../store";

type sampleProps = {
  lint: (
    source: string,
    setModelMarkers: (errors: any, source: any) => void
  ) => void;
  test_sample: (
    sample: string,
    question: any,
    fields: any,
    index: number
  ) => void;
  formProps: FormProps;
};

const ExpandMore = styled((props: any) => {
  return <IconButton {...props} />;
})(({ expand }) => ({
  transform: `rotate(${expand ? 0 : 180}deg)`,
  marginLeft: "auto",
}));

const sampleValidation = (
  values: {
    source: string;
    syntax_error: boolean;
    test_results?: any;
    expanded: boolean;
  }[]
) => {
  if (!values) return;
  let found = false;
  let errors = values.map((sample) => {
    if (!sample.source && sample.test_results === undefined) {
      found = true;
      return { source: "Sample cannot be empty, sample must also be tested" };
    }
    if (sample.syntax_error) {
      found = true;
      return { source: "Sample contains a syntax error" };
    }
    if (!sample.source) {
      found = true;
      return { source: "Sample cannot be empty" };
    }
    if (sample.test_results == undefined) {
      found = true;
      return { source: "Sample solution must be tested" };
    }
    if (sample.test_results["containsConflicts"] == true) {
      found = true;
      return {
        source:
          "Sample solution does not correspond to specified inputs and outputs",
      };
    }
    return {};
  });
  if (found) {
    return errors;
  }
};

const management_buttons = (
  fields: {
    value: {
      question_id: any;
      source: string;
      syntax_error: boolean;
      test_results?: any;
      expanded: boolean;
    }[];
    push: (x: any) => void;
    pop: () => void;
  },
  formProps: any
) => {
  return (
    <Stack spacing={2} direction="row">
      <Button
        onClick={() => {
          fields.push({
            id: crypto.randomUUID().replaceAll("-", ""),
            source: "def sample():\n\tpass",
            syntax_error: false,
            expanded: false,
            question_id: formProps.values.id,
          });
        }}
      >
        Add
      </Button>
      <Button
        onClick={() => {
          if (fields.value.length && fields.value.length > 1) fields.pop();
        }}
      >
        Remove
      </Button>
    </Stack>
  );
};

const handleEditorDidMount = (editor: any, monaco: any, ...kwargs: any) => {
  let fields_ref = kwargs[0];
  let index = kwargs[1];
  let intervalId: number;
  const model = editor.getModel();
  const setModelMarkers = (
    errors: { startLine: string; startCol: string }[],
    source: any
  ) => {
    let modelMarkers: any = [];
    let fields = fields_ref.current;
    if (errors) {
      for (let error of errors) {
        modelMarkers.push({
          startLineNumber: parseInt(error.startLine),
          startColumn: parseInt(error.startCol),
          endLineNumber: model.getLineLength(error.startLine) + 1,
          endColumn: parseInt(error.startLine),
          message: error["message"],
          severity: monaco.MarkerSeverity.Error,
        });
      }
      if (editor.getValue() == source) {
        fields.update(index, { ...fields.value[index], syntax_error: true });
      }
    } else {
      if (editor.getValue() == source) {
        fields.update(index, { ...fields.value[index], syntax_error: false });
      }
    }
    if (editor.getValue() == source) {
      monaco.editor.setModelMarkers(model, "owner", modelMarkers);
    }
  };
  lint(editor.getValue(), setModelMarkers);

  editor.onKeyUp((e: any) => {
    let fields = fields_ref.current;
    fields.update(index, {
      ...fields.value[index],
      source: editor.getValue(),
    });
    clearInterval(intervalId);
    intervalId = setTimeout(() => {
      store.dispatch<any>(lint(editor.getValue(), setModelMarkers));
    }, AUTOSAVE_DELAY);
    if (e.keyCode !== 91 && e.metaKey) {
      if (e.keyCode === 49) {
        e.preventDefault();
        store.dispatch<any>(lint(editor.getValue(), setModelMarkers));
        clearInterval(intervalId);
      }
    }
  });
};

const render_samples = (fields: any, formProps: any) => {
  const stateRef = useRef();
  stateRef.current = fields;
  return (
    <div style={{ flexGrow: 2, position: "relative" }}>
      {fields.value.map((value: any, index: number) => {
        return (
          <Card
            raised={false}
            variant="outlined"
            sx={{
              p: 3,
              border: 0,
              borderRadius: 0,
              borderBottom: 1,
              borderColor: "divider",
            }}
            key={`card ${index}`}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="h5" component="div">
                  Sample_{index}
                </Typography>
                <Stack direction="row" alignItems="center">
                  <Button
                    onClick={() => {
                      if (value.source !== "" && !value.syntax_error) {
                        store.dispatch<any>(
                          test_sample(
                            value.source,
                            formProps.values,
                            fields,
                            index
                          )
                        );
                      }
                    }}
                  >
                    Test sample
                  </Button>
                  {value.test_results == undefined ? (
                    <RadioButtonUncheckedTwoToneIcon color="error" />
                  ) : value.test_results["containsConflicts"] ? (
                    <CancelOutlinedIcon color="error" />
                  ) : (
                    <CheckCircleOutlineTwoToneIcon color="success" />
                  )}
                </Stack>
              </Stack>
              <Accordion elevation={0} disableGutters>
                <AccordionSummary>Verification results</AccordionSummary>
                <AccordionDetails>
                  <ResponseContent test_results={value.test_results} />
                </AccordionDetails>
              </Accordion>
              {formProps.errors.sample_solutions &&
                formProps.errors.sample_solutions[index].source && (
                  <FormHelperText error>
                    {formProps.errors.sample_solutions[index].source}
                  </FormHelperText>
                )}
            </CardContent>
            <ExpandMore
              expand={value.expanded}
              onClick={() => {
                fields.update(index, {
                  ...value,
                  expanded: !value.expanded,
                });
              }}
            >
              <ExpandMoreIcon />
            </ExpandMore>
            <Collapse in={value.expanded}>
              <Editor
                className="mt-4 border"
                height="50vh"
                width="100%"
                defaultLanguage="python"
                theme="light"
                options={{
                  fontSize: 16,
                }}
                onMount={(editor: any, monaco: any) =>
                  handleEditorDidMount(editor, monaco, stateRef, index)
                }
                value={value.source}
              />
            </Collapse>
          </Card>
        );
      })}
    </div>
  );
};

const Samples = ({ formProps }: sampleProps) => {
  return (
    <div
      style={{
        padding: 15,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <FormLabel>Samples with correct structure</FormLabel>
      <FieldArray name="sample_solutions" validate={sampleValidation}>
        {({ fields }) => {
          return (
            <>
              {management_buttons(fields, formProps)}
              {render_samples(fields, formProps)}
            </>
          );
        }}
      </FieldArray>
    </div>
  );
};

export default connect(null, { lint, test_sample })(Samples);
