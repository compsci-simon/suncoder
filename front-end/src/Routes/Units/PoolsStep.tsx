import {
  FormHelperText,
  List,
  ListItemButton,
  ListItemText,
  Paper,
} from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Pagination from "@mui/material/Pagination";
import { useTheme } from "@mui/material/styles";

const PoolsStep = (props: any) => {
  const [activePool, _setActivePool] = useState(0);
  const setActivePool = (e: any, value: number) => _setActivePool(value - 1);
  const [boxWidth, setBoxWidth] = useState(0);
  const measuredRef = useCallback((node: any) => {
    if (node !== null) {
      setBoxWidth(node.getBoundingClientRect().width / 3);
    }
  }, []);
  const theme = useTheme();
  const formProps = props.formProps;
  console.log(formProps);
  if (!formProps) return null;
  let selected_questions: string[] = [];
  const pools = props.formProps.values.pools.sort(
    (a: any, b: any) => a.poolnum - b.poolnum
  );
  for (let pool of pools) {
    for (let question of pool.questions) {
      selected_questions.push(question.id);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        flexDirection: "row",
      }}
    >
      <div
        style={{
          width: "200px",
          height: "100%",
        }}
      >
        <Paper
          elevation={0}
          variant="outlined"
          sx={{ height: "100%", width: "100%", padding: 2 }}
        >
          <List>
            <ListItemText>Question set</ListItemText>
            {formProps.values.questions.map((question: any) => {
              if (selected_questions.includes(question.id)) return null;
              return (
                <ListItemButton
                  key={question.id}
                  onClick={() => {
                    let newPool = { ...pools[activePool] };
                    newPool.questions.push({
                      id: question.id,
                      name: question.name,
                    });
                    formProps.form.mutators.update(
                      "pools",
                      activePool,
                      newPool
                    );
                  }}
                >
                  {question.name}
                </ListItemButton>
              );
            })}
          </List>
        </Paper>
      </div>
      <div style={{ flexGrow: 2 }}>
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <div
            style={{ display: "flex", justifyContent: "center" }}
            className="p-2"
          >
            <Pagination
              count={pools.length}
              variant="outlined"
              color="primary"
              onChange={setActivePool}
            />
          </div>
          <div
            style={{ flexGrow: 2, overflow: "hidden", position: "relative" }}
            ref={measuredRef}
          >
            <div
              style={{
                position: "absolute",
                display: "flex",
                height: "100%",
                left: `${(1 - activePool) * boxWidth}px`,
                transition: "0.3s ease-in-out",
              }}
            >
              {pools.map((pool: any, index: number) => {
                let sx: any = { height: "100%", padding: 2 };
                if (index === activePool) {
                  sx = {
                    height: "100%",
                    outline: `2px solid ${theme.palette.primary.light}`,
                    padding: 2,
                  };
                }
                return (
                  <div
                    style={{
                      height: "100%",
                      width: boxWidth,
                      padding: 10,
                    }}
                    key={pool.id}
                  >
                    <Paper elevation={0} variant="outlined" sx={sx}>
                      {formProps.errors["pools"] &&
                        formProps.errors["pools"][index] && (
                          <FormHelperText error>
                            {formProps.errors["pools"][index]}
                          </FormHelperText>
                        )}
                      <List>
                        <ListItemText>Pool {index + 1}</ListItemText>
                        {pool.questions.map((question: any) => {
                          return (
                            <ListItemButton
                              key={question.id}
                              onClick={() => {
                                let newPool = {
                                  ...formProps.values.pools[index],
                                };
                                newPool.questions = newPool.questions.filter(
                                  (q: any) => q.id != question.id
                                );
                                formProps.form.mutators.update(
                                  "pools",
                                  index,
                                  newPool
                                );
                              }}
                            >
                              {question.name}
                            </ListItemButton>
                          );
                        })}
                      </List>
                    </Paper>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolsStep;
