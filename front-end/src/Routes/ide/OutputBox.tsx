import React from "react";

import "./outputbox.css";
import { connect } from "react-redux";
import { RootState } from "../../store";
import { withRouter } from "react-router";
import Tabs from "../../components/util/Tabs";
import { Paper } from "@mui/material";

type OutputBoxProps = {
  results: {
    cases_passed: number;
    cases_failed: number;
    total_cases: number;
    feedback: string;
    tests: {
      [id: string]: {
        Pass: string;
        Feedback: string;
        Errors: string;
        stdOut: string;
        stdErr: string;
      };
    };
    compile: boolean;
    errors: string;
  };
  selected_item: string;
  stdout: boolean;
  stderr: boolean;
};

const OutputBox = ({
  results,
  selected_item,
  stdout,
  stderr,
}: OutputBoxProps) => {
  let case_feedback: any = [];
  if (results.tests) case_feedback = Object.values(results.tests);
  let case_feedback_object: any = {};
  for (let idx in case_feedback) {
    case_feedback_object[idx] = "";
    if (case_feedback[idx].Feedback) {
      case_feedback_object[idx] += case_feedback[idx].Feedback;
    }
    if (case_feedback[idx].Errors) {
      case_feedback_object[idx] += `\n${case_feedback[idx].Errors}`;
    }
  }
  case_feedback_object[-1] = results.feedback;
  if (
    case_feedback_object[-1] == "" &&
    results.cases_failed == 0 &&
    results.cases_passed > 0
  ) {
    case_feedback_object[-1] = "Well done! You have passed all the test cases.";
  }
  if (!results.compile) {
    case_feedback_object[-1] = results.errors;
  }
  let feedback_text: any = null;
  if (case_feedback_object[selected_item]) {
    feedback_text = case_feedback_object[selected_item].split("\n");
  }
  let tabs = [
    {
      name: "Results",
      content: (
        <div className="h-100 position-relative" style={{ overflow: "auto" }}>
          {case_feedback_object[selected_item] && feedback_text ? (
            <div style={{ position: "absolute", width: "100%" }}>
              <Paper
                style={{
                  width: "80%",
                  margin: "20px auto 20px auto",
                  padding: "15px",
                  overflowWrap: "anywhere",
                }}
              >
                {feedback_text.map((item: any, index: number) => {
                  if (item) {
                    return <p key={index}>{item}</p>;
                  }
                })}
              </Paper>
            </div>
          ) : null}
        </div>
      ),
    },
  ];

  if (stdout) {
    tabs.push({
      name: "Stdout",
      content: (
        <div className="h-100 position-relative" style={{ overflow: "auto" }}>
          {stdout && results.tests && (
            <div style={{ position: "absolute", width: "100%" }}>
              <Paper
                style={{
                  width: "80%",
                  margin: "20px auto 20px auto",
                  padding: "15px",
                  overflowWrap: "anywhere",
                }}
              >
                {results.tests[selected_item + 1] &&
                  results.tests[selected_item + 1].stdOut
                    .split("\n")
                    .map((item: any, index: number) => {
                      if (item) {
                        return <p key={index}>{item}</p>;
                      }
                    })}
              </Paper>
            </div>
          )}
        </div>
      ),
    });
  }
  if (stderr) {
    tabs.push({
      name: "Stderr",
      content: (
        <div className="h-100 position-relative" style={{ overflow: "auto" }}>
          {stderr && results.tests && (
            <div style={{ position: "absolute", width: "100%" }}>
              <Paper
                style={{
                  width: "80%",
                  margin: "20px auto 20px auto",
                  padding: "15px",
                  overflowWrap: "anywhere",
                }}
              >
                {results.tests[selected_item + 1] &&
                  results.tests[selected_item + 1].stdErr
                    .split("\n")
                    .map((item: any, index: number) => {
                      if (item) {
                        return <p key={index}>{item}</p>;
                      }
                    })}
              </Paper>
            </div>
          )}
        </div>
      ),
    });
  }

  return <Tabs tabs={tabs} />;
};

const mapStateToProps = (state: RootState, ownProps: any) => {
  if (
    state.code_run_results &&
    ownProps.match.params.question_id === state.code_run_results.question_id
  ) {
    return {
      results: state.code_run_results,
      selected_item: state.selected_item,
    };
  }
  return {
    results: {},
    stdOut: "",
    stdErr: "",
    selected_item: "Test",
  };
};

export default withRouter(connect(mapStateToProps, {})(OutputBox));
