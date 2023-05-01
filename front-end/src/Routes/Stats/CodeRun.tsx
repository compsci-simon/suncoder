import React, { useEffect, useState } from "react";
import { Button, Stack, Slider, Divider, Switch } from "@mui/material";
import Editor from "@monaco-editor/react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import useInterval from "../../hooks/useInterval";
import { applyKeyStrokes, minMag } from "./helper";
import { RootState } from "../../store";
import { connect } from "react-redux";
import { selectors } from "../../orm/orm";
import { ConnectionLineType } from "react-flow-renderer";

const CodeRun = (props: any) => {
  const [code, setCode] = useState("");
  const [versionId, _setVersionId] = useState(0);
  const [switchVal, _setSwitchVal] = useState(
    props.match.params.keystroke ? false : true
  );
  const setSwitchVal = (value: boolean) => {
    if (props.code_run === undefined) {
      _setSwitchVal(false);
      return;
    } else if (value) {
      if (
        versionId < props.code_run.start_version ||
        versionId > props.code_run.end_version
      ) {
        let d1 = props.code_run.start_version - versionId;
        let d2 = props.code_run.end_version - versionId;
        setVersionId(versionId + minMag(d1, d2));
      }
    }
    _setSwitchVal(value);
  };
  const setVersionId = (value: number) => {
    if (!props.question || !props.user_code) return;
    if (
      (switchVal &&
        props.code_run &&
        value >= props.code_run.start_version &&
        value <= props.code_run.end_version) ||
      (!switchVal && value >= 0 && value <= props.user_code.changes.length)
    ) {
      let res = applyKeyStrokes(
        props.question.template,
        props.user_code.changes,
        value
      );
      setCode(res);
      _setVersionId(value);
    }
  };
  const [playing, setPlaying] = useState(false);
  const [delay, setDelay] = useState(550);

  useEffect(() => {
    if (props.question) setCode(props.question.template);
    if (props.code_run) {
      setVersionId(props.code_run.start_version);
    } else if (props.match.params.keystroke) {
      setSwitchVal(false);
      setVersionId(parseInt(props.match.params.keystroke));
    }
  }, [props.question, props.code_run]);

  const play = () => {
    if (
      (switchVal && versionId == props.code_run.end_version) ||
      (!switchVal && versionId == props.user_code.changes.length)
    ) {
      setPlaying(false);
    } else {
      setVersionId(versionId + 1);
    }
  };

  useInterval(() => {
    if (playing) {
      play();
    }
  }, delay);

  return (
    <div>
      <Stack
        divider={<Divider orientation="horizontal" flexItem />}
        spacing={4}
      >
        <Stack spacing={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            spacing={4}
            sx={{ p: 3, pt: 4 }}
          >
            <h5>{versionId != null ? "keypress: " + versionId : null}</h5>
            <Stack direction="row" spacing={2}>
              <Slider
                style={{ width: "200px" }}
                size="small"
                defaultValue={550}
                aria-label="Small"
                valueLabelDisplay="auto"
                value={delay}
                onChange={(e: any) => setDelay(e.target.value)}
                step={100}
                min={50}
                max={750}
                marks
              />
              <Button
                variant="outlined"
                color={playing ? "warning" : "success"}
                onClick={() => {
                  setPlaying(!playing);
                }}
              >
                {playing ? <PauseIcon /> : <PlayArrowIcon />}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setVersionId(versionId - 1);
                }}
              >
                <UndoIcon />
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setVersionId(versionId + 1);
                }}
              >
                <RedoIcon />
              </Button>
            </Stack>
          </Stack>
          <Stack
            justifyContent="center"
            alignItems="center"
            direction="row"
            spacing={4}
          >
            <Slider
              style={{ width: "400px" }}
              defaultValue={550}
              aria-label="Small"
              valueLabelDisplay="auto"
              value={versionId ? versionId : 0}
              onChange={(e: any) => {
                setVersionId(e.target.value);
              }}
              step={1}
              min={0}
              max={props.user_code ? props.user_code.versionId : 1}
            />
            <Switch
              checked={switchVal}
              onChange={() => {
                setSwitchVal(!switchVal);
              }}
              size="small"
            />
          </Stack>
        </Stack>
      </Stack>
      <div className="mt-3 border-top border-bottom">
        <Editor
          height="60vh"
          defaultLanguage="python"
          theme="light"
          options={{
            fontSize: 16,
            readOnly: true,
          }}
          value={code}
        />
      </div>
    </div>
  );
};

const mapStateToProps = (state: RootState, ownProps: any) => {
  return {
    user_code: selectors.user_code_instance(
      state,
      ownProps.match.params.user_code_id
    ),
    code_run: selectors.code_run_instance(
      state,
      ownProps.match.params.code_run_id
    ),
    question: selectors.question(state, ownProps.match.params.question_id),
  };
};

export default connect(mapStateToProps, null)(CodeRun);
