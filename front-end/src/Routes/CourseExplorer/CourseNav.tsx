import React, { useEffect, useState } from "react";
import {
  Collapse,
  Breadcrumbs,
  Typography,
  Card,
  CardHeader,
  CardContent,
  IconButton,
  Stack,
  CircularProgress,
  Box,
  CircularProgressProps,
  circularProgressClasses,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { connect } from "react-redux";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

import history from "../../history";
import { RootState } from "../../store";
import { selectors } from "../../orm/orm";

function FacebookCircularProgress(props: any) {
  return (
    <Box sx={{ position: "relative" }}>
      <CircularProgress
        variant="determinate"
        sx={{
          color: (theme) =>
            theme.palette.grey[theme.palette.mode === "light" ? 200 : 800],
        }}
        size={25}
        thickness={4}
        {...props}
        value={100}
      />
      <CircularProgress
        variant="determinate"
        disableShrink
        sx={{
          // color: (theme) =>
          //   theme.palette.mode === "light" ? "#20C36E" : "#20C36E",
          animationDuration: "550ms",
          position: "absolute",
          left: 0,
          [`& .${circularProgressClasses.circle}`]: {
            strokeLinecap: "round",
          },
        }}
        color="success"
        value={props.progress}
        size={25}
        thickness={4}
        {...props}
      />
    </Box>
  );
}

const CourseNav = (props: any) => {
  const [open, setOpen] = useState<boolean[]>([]);

  const handleClick = (index: number) => {
    let newOpen = [...open];
    newOpen[index] = !newOpen[index];
    setOpen(newOpen);
  };

  useEffect(() => {
    let opens: boolean[] = [];
    for (let i = 0; i < props.courses.length; i++) {
      opens.push(true);
    }
    setOpen(opens);
  }, []);

  const coursesComponent = () => {
    if (!props.courses) {
      return <h3>You have not registered for any courses yet.</h3>;
    }
    return props.courses.map((c: any, index: number) => {
      const units = Object.values(c.units);
      const unitListItems = units.map((unit: any, index2) => {
        if (!unit.disabled) {
          // A user has completed the prerequisites
          return (
            <Stack>
              <Stack direction="row" justifyContent="space-between">
                <Stack direction="row" spacing={2}>
                  <Typography display="block">{unit.name}</Typography>
                  <FacebookCircularProgress
                    progress={(unit.pools_completed / unit.numPools) * 100}
                  />
                </Stack>
                <IconButton
                  onClick={() =>
                    history.push(`/courses/${c.id}/units/${unit.id}/questions`)
                  }
                >
                  <ArrowForwardRoundedIcon />
                </IconButton>
              </Stack>
            </Stack>
          );
        } else {
          // A user has not completed the prerequisites
          return (
            <Stack>
              <Stack direction="row" justifyContent="space-between">
                <Stack direction="row" spacing={2}>
                  <Typography sx={{ color: "gray" }} display="block">
                    {unit.name}
                  </Typography>
                  <FacebookCircularProgress
                    progress={(unit.pools_completed / unit.numPools) * 100}
                  />
                </Stack>
                <IconButton disabled>
                  <ArrowForwardRoundedIcon />
                </IconButton>
              </Stack>
              <Typography variant="caption" sx={{ color: "gray" }}>
                {unit.prereqs_not_met.join(", ")} must first be completed
              </Typography>
            </Stack>
          );
        }
      });
      if (units.length === 0) {
        return (
          <Card variant="outlined">
            <CardHeader title={c.name} subheader="No units" />
          </Card>
        );
      } else {
        return (
          <Card key={index} variant="outlined">
            <CardHeader title={c.name} />
            <hr />
            <CardContent>
              <Stack spacing={2} divider={<hr />}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="h6" component="div">
                    Tutorials
                  </Typography>
                  {open[index] ? (
                    <IconButton>
                      <ExpandLess onClick={() => handleClick(index)} />
                    </IconButton>
                  ) : (
                    <IconButton>
                      <ExpandMore onClick={() => handleClick(index)} />
                    </IconButton>
                  )}
                </Stack>
                <Collapse in={open[index]}>
                  <Stack divider={<hr />} spacing={1}>
                    {unitListItems}
                  </Stack>
                </Collapse>
              </Stack>
            </CardContent>
          </Card>
        );
      }
    });
  };

  return (
    <React.Fragment>
      <Breadcrumbs className="pt-3 pl-3">
        <Typography>Courses</Typography>
      </Breadcrumbs>
      <Stack spacing={2} sx={{ p: 2 }}>
        {coursesComponent()}
      </Stack>
    </React.Fragment>
  );
};

const mapStateToProps = (state: RootState) => {
  return { courses: selectors.enrolled_courses(state) };
};

export default connect(mapStateToProps, {})(CourseNav);
