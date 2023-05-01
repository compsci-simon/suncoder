import {
  List,
  ListItemButton,
  Breadcrumbs,
  Typography,
  ListItemText,
  Tooltip,
  Card,
  CardHeader,
  Stack,
  CardActions,
  Button,
  CardContent,
  Chip,
} from "@mui/material";
import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { Link } from "react-router-dom";
import { compose } from "redux";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CodeIcon from "@mui/icons-material/Code";
import { green, orange, red, purple } from "@mui/material/colors";

import history from "../../history";
import { selectors } from "../../orm/orm";
import { RootState } from "../../store";

const type_terms = ["arrays", "dynamic programming"];

const UnitQuestions = (props: any) => {
  return (
    <Stack spacing={2} sx={{ p: 3 }}>
      {props.pools &&
        props.pools.map((pool: any, index: number) => {
          if (pool.questions.length == 0) return <div></div>;
          let title = "";
          if (pool["prereqs"]) {
            title = " [Prerequisites:";
            for (let prereq of pool["prereqs"]) {
              title += " Part " + (parseInt(prereq["poolnum"]) + 1) + ",";
            }
            title = title.substring(0, title.length - 1) + "]";
          }
          const question = {
            id: pool.questions[0].id,
            name: pool.questions[0].name,
            completed: pool.questions[0].completed,
            categories: pool.questions[0].categories,
          };
          // const question_buttons = pool.questions.map(
          //   (question: any, index: number) => {
          //     return (
          //       <Card variant="outlined">
          //         <CardHeader title={question.name} />
          //       </Card>
          // <ListItemButton
          //   disabled={question["disabled"]}
          //   key={`question-${index}`}
          // onClick={() =>
          //   history.push(
          //     `/courses/${props.match.params.course_id}/units/${props.match.params.unit_id}/pools/${pool.id}/questions/${question.id}/IDE`
          //   )
          // }
          // >
          //   {question.name}
          // </ListItemButton>
          //     );
          //   }
          // );
          if (pool["disabled"]) {
            // return (
            // <React.Fragment key={`pool-${pool.id}`}>
            //   <Tooltip
            //     key={`tooltip-${index}`}
            //     title={title}
            //     placement="top-start"
            //   >
            //     <ListItemText key={`listitem-${index}`}>
            //       Part {pool.poolnum + 1}
            //     </ListItemText>
            //   </Tooltip>
            //   {question_buttons}
            // </React.Fragment>
            // );
            return (
              <Card variant="outlined" key={`pool-${pool.id}`}>
                <CardHeader
                  title={
                    <Stack justifyContent="space-between" direction="row">
                      {question.name}
                      {question.completed ? (
                        <CheckCircleOutlineIcon color="success" />
                      ) : (
                        <CancelOutlinedIcon color="error" />
                      )}
                    </Stack>
                  }
                  subheader={`Part ${pool.poolnum + 1}`}
                />
                <hr />
                <CardContent sx={{ p: 0 }}>
                  {question.categories.length > 0 ? (
                    question.categories.map((category: { name: string }) => {
                      let color: "default" | "success" | "warning" | "error" =
                        "default";
                      if (category.name.toLowerCase() == "easy") {
                        color = "success";
                      } else if (category.name.toLowerCase() == "medium") {
                        color = "warning";
                      } else if (category.name.toLowerCase() == "hard") {
                        color = "error";
                      }
                      return (
                        <Chip
                          variant="outlined"
                          style={{ marginLeft: "5px", marginTop: "tpx" }}
                          label={category.name}
                          color={color}
                        />
                      );
                    })
                  ) : (
                    <Chip
                      sx={{ marginLeft: "5px" }}
                      variant="outlined"
                      label="No categories"
                    />
                  )}
                </CardContent>
                <hr />
                <CardActions>
                  <Stack>
                    <Typography variant="caption" display="block">
                      {pool["prereqs"]}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<CodeIcon />}
                      disabled
                    >
                      IDE
                    </Button>
                  </Stack>
                </CardActions>
              </Card>
            );
          } else {
            return (
              <Card variant="outlined" key={`pool-${pool.id}`}>
                <CardHeader
                  title={
                    <Stack justifyContent="space-between" direction="row">
                      {question.name}
                      {question.completed ? (
                        <CheckCircleOutlineIcon color="success" />
                      ) : (
                        <CancelOutlinedIcon color="error" />
                      )}
                    </Stack>
                  }
                  subheader={`Part ${pool.poolnum + 1}`}
                />
                <hr />
                <CardContent sx={{ p: 0 }}>
                  {question.categories.length > 0 ? (
                    question.categories.map((category: { name: string }) => {
                      let color: "default" | "success" | "warning" | "error" =
                        "default";
                      if (category.name.toLowerCase() == "easy") {
                        color = "success";
                      } else if (category.name.toLowerCase() == "medium") {
                        color = "warning";
                      } else if (category.name.toLowerCase() == "hard") {
                        color = "error";
                      }
                      return (
                        <Chip
                          variant="outlined"
                          style={{ marginLeft: "5px", marginTop: "tpx" }}
                          label={category.name}
                          color={color}
                        />
                      );
                    })
                  ) : (
                    <Chip
                      sx={{ marginLeft: "5px" }}
                      variant="outlined"
                      label="No categories"
                    />
                  )}
                </CardContent>
                <hr />
                <CardActions>
                  <Button
                    onClick={() =>
                      history.push(
                        `/courses/${props.match.params.course_id}/units/${props.match.params.unit_id}/pools/${pool.id}/questions/${question.id}/IDE`
                      )
                    }
                    variant="outlined"
                    size="large"
                    startIcon={<CodeIcon />}
                  >
                    IDE
                  </Button>
                </CardActions>
              </Card>
            );
          }
        })}
    </Stack>
  );
};

const mapStateToProps = (state: RootState, ownProps: any) => {
  let course_id = ownProps.match.params.course_id;
  let unit_id = ownProps.match.params.unit_id;

  return { pools: selectors.unit_pools(state, course_id, unit_id) };
};

export default compose(withRouter, connect(mapStateToProps, {}))(UnitQuestions);
