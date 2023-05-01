import React, { useRef, useState } from "react";
import { Stack, Divider, Button } from "@mui/material";
import Editor from "@monaco-editor/react";
import { compose } from "redux";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import Split from "react-split";

import { flush_user_code, execute_code, lint } from "./actions";
import { log_keystroke } from "./actions";
import "./ide.css";
import Bullet from "./Bullet";
import OutputBox from "./OutputBox";
import TestExplorer from "./TestExplorer";
import store, { RootState } from "../../store";
import { selectors } from "../../orm/orm";

const AUTOSAVE_DELAY = 1000;

type IDEProps = {
  user_code: {
    id: string;
    source: string;
    versionId: number;
  };
  showExplorer: boolean;
  user_code_changed: (user_code: any) => void;
  log_keystroke: (keystroke_object: any) => void;
  fullscreen: boolean;
  setFullscreen: () => void;
  match: any;
  execute_code: (
    course_id: string,
    unit_id: string,
    pool_id: string,
    question_id: string
  ) => void;
  save: (question_data: any) => void;
  lint: (
    source: string,
    setModelMarkers: (modelchange: any, source: string) => void
  ) => void;
  user_id: string;
  question_id: string;
  unit_id: string;
  course_id: string;
  question: any;
};

const handleEditorDidMount = (editor: any, monaco: any, ...args: any) => {
  const model = editor.getModel();
  let intervalId: number = 0;
  let question_ref = args[0];
  let ide = args[1];
  let setIde = args[2];
  let user_code_ref = args[3];
  const setModelMarkers = (
    errors: { startLine: string; startCol: string }[],
    source: any
  ) => {
    let modelMarkers: any = [];
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
    }
    if (editor.getValue() == source) {
      monaco.editor.setModelMarkers(model, "owner", modelMarkers);
    }
  };
  if (question_ref.current.linting) {
    store.dispatch<any>(lint(editor.getValue(), setModelMarkers));
  }

  editor.onKeyDown((e: any) => {
    if (e.keyCode === 49 && e.metaKey) {
      e.preventDefault();
      setIde({ ...ide, saved: true });
      store.dispatch<any>(flush_user_code(user_code_ref.current.id));
    }
  });

  editor.onDidChangeModelContent((e: any) => {
    // We need to change the local state of user code so that when user code is flushed, the changes are correctly reflected
    let question = question_ref.current;
    store.dispatch<any>(
      log_keystroke({
        changes: e.changes,
        source: editor.getValue(),
        user_id: store.getState().identity.id,
        question_id: question.id,
        id: user_code_ref.current.id,
      })
    );
    // Countdown after content has changed
    setIde({ ...ide, saved: false });
    clearInterval(intervalId);
    intervalId = setTimeout(() => {
      setIde({ ...ide, saved: true });
      store.dispatch<any>(flush_user_code(user_code_ref.current.id));
      if (question.linting) {
        store.dispatch<any>(lint(editor.getValue(), setModelMarkers));
      }
    }, AUTOSAVE_DELAY);
  });
};

const IDE = (props: IDEProps) => {
  if (!props.user_code || !props.question) return <div></div>;
  const [ide, setIde] = useState({
    saved: true,
    fontSize: 18,
    theme: "light",
  });
  const ucid = useRef("");
  ucid.current = props.user_code.id;

  const executeCode = () => {
    setIde({ ...ide, saved: true });
    props.execute_code(
      props.match.params.course_id,
      props.match.params.unit_id,
      props.match.params.pool_id,
      props.match.params.question_id
    );
  };
  const showStdout = props.question ? props.question.stdout : false;
  const showStderr = props.question ? props.question.stderr : false;
  const question_ref = useRef();
  question_ref.current = props.question;
  const user_code_ref = useRef<any>();
  user_code_ref.current = props.user_code;

  return (
    <div>
      <Split
        gutterSize={6}
        minSize={[0, 300]}
        sizes={props.showExplorer ? [30, 70] : [0, 100]}
        direction="horizontal"
        style={{ height: "100%", width: "100%" }}
        snapOffset={64}
        className="split"
      >
        <div style={{ overflow: "hidden" }}>
          <TestExplorer />
        </div>
        <Split
          gutterSize={6}
          minSize={0}
          sizes={[70, 30]}
          direction="vertical"
          style={{ height: "100%" }}
          snapOffset={64}
        >
          <Stack
            direction="column"
            divider={<Divider orientation="horizontal" />}
            style={{ height: "100%", overflowY: "hidden" }}
          >
            <Stack direction="row" justifyContent="space-between">
              <div />
              <Stack direction="row" className="menu-item" spacing={2}>
                <Bullet saved={ide.saved} />
                <Button
                  color="success"
                  onClick={() => {
                    executeCode();
                  }}
                >
                  Run
                </Button>
              </Stack>
            </Stack>
            <Editor
              height="100%"
              width="100%"
              defaultLanguage="python"
              theme={ide.theme}
              options={{
                fontSize: ide.fontSize,
              }}
              value={props.user_code.source}
              onMount={(editor: any, monaco: any) => {
                handleEditorDidMount(
                  editor,
                  monaco,
                  question_ref,
                  ide,
                  setIde,
                  user_code_ref
                );
              }}
            />
          </Stack>
          <OutputBox stdout={showStdout} stderr={showStderr} />
        </Split>
      </Split>
    </div>
  );
};

const mapStateToProps = (state: RootState, ownProps: any) => {
  return {
    user_code: selectors.question_user_code(
      state,
      ownProps.match.params.question_id
    ),
    user_id: state.identity.id,
    question_id: ownProps.match.params.question_id,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, {
    flush_user_code,
    execute_code,
    log_keystroke,
    lint,
  })
)(IDE);
