import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  Typography,
} from "@mui/material";
import React, { useRef } from "react";
import { connect } from "react-redux";
import { info_type, selectors } from "../../orm/orm";
import { RootState } from "../../store";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import MemoryIcon from "@mui/icons-material/Memory";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { green, pink, purple } from "@mui/material/colors";
import { DataGrid } from "@mui/x-data-grid";
import history from "../../history";
import WhenRunChart from "./WhenRunChart";
import RuntimeChart from "./RuntimeChart";

type propType = {
  match: {
    params: {
      question_id: string;
    };
  };
  location: any;
  info: info_type;
};

const QuestionCharts = (props: propType) => {
  if (!props.info) return <div></div>;
  let card1Ref = useRef<any>(null);
  let height = 200;
  let height2 = 300;

  let columns = [
    { field: "id" },
    { field: "user_code_id", headerName: "User Code ID" },
    { field: "idx", headerName: "Keystroke number" },
    {
      field: "severity",
      headerName: "Severity",
      renderCell: (params: any) => {
        let color: "success" | "warning" | "error" = "success";
        if (params.row.severity == "medium") {
          color = "warning";
        } else if (params.row.severity == "high") {
          color = "error";
        }
        return <Chip color={color} label={params.row.severity} />;
      },
    },
    {
      field: "view",
      headerName: "View",
      renderCell: (params: any) => {
        return (
          <Button
            onClick={() =>
              history.push(
                `/stats/${props.match.params.question_id}/user_code/${params.row.user_code_id}/reconstruct/${params.row.idx}`
              )
            }
          >
            View
          </Button>
        );
      },
    },
  ];

  return (
    <Grid container spacing={2} sx={{ p: 4 }}>
      <Grid item xs={12}>
        <h2>
          <b>{props.info.question_name} report</b>
        </h2>
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Card variant="outlined">
          <CardHeader
            title={
              <div>
                <Typography variant="caption">Total users attempted</Typography>
                <h2>
                  <b>{props.info.users_attempted}</b>
                </h2>
              </div>
            }
            avatar={
              <Avatar sx={{ bgcolor: pink[500] }}>
                <PeopleAltOutlinedIcon />
              </Avatar>
            }
          />
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Card variant="outlined">
          <CardHeader
            title={
              <div>
                <Typography variant="caption">Total users passed</Typography>
                <h2>
                  <b>{props.info.users_passed}</b>
                </h2>
              </div>
            }
            avatar={
              <Avatar sx={{ bgcolor: green[500] }}>
                <FactCheckIcon />
              </Avatar>
            }
          />
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Card variant="outlined">
          <CardHeader
            title={
              <div>
                <Typography variant="caption">Total code executions</Typography>
                <h2>
                  <b>{props.info.code_run_times.length}</b>
                </h2>
              </div>
            }
            avatar={
              <Avatar sx={{ bgcolor: purple[500] }}>
                <MemoryIcon />
              </Avatar>
            }
          />
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <Card variant="outlined">
          <CardHeader
            title={
              <div>
                <Typography variant="caption">Completion rate</Typography>
                <h2>
                  <b>
                    {(props.info.users_passed / props.info.users_enrolled) *
                      100}
                    %
                  </b>
                </h2>
              </div>
            }
            avatar={
              <Avatar sx={{ bgcolor: green[300] }}>
                <VerifiedUserIcon />
              </Avatar>
            }
          />
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card ref={card1Ref} variant="outlined">
          <CardHeader title={"When code was run"} />
          <hr />
          <CardContent>
            <WhenRunChart
              attempts_per_day={props.info.attempts_per_day}
              height={height}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardHeader title="Suspicious code" />
          <hr />
          <CardContent sx={{ p: 0 }}>
            <div style={{ height: height2 }}>
              <DataGrid
                initialState={{
                  columns: {
                    columnVisibilityModel: {
                      id: false,
                    },
                  },
                }}
                rows={props.info.suspicious_points}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5]}
                disableSelectionOnClick
                sx={{ border: 0 }}
              />
            </div>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardHeader title="Runtimes(ms)" />
          <hr />
          <CardContent sx={{ p: 0 }}>
            <RuntimeChart
              runtimes={props.info.code_run_times}
              height={height2}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

const mapStateToProps = (state: RootState, ownProps: propType) => {
  return {
    info: selectors.question_charts(state, ownProps.match.params.question_id),
  };
};

export default connect(mapStateToProps)(QuestionCharts);
