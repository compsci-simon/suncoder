import React from "react";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeItem, { TreeItemProps } from "@mui/lab/TreeItem";
import { connect } from "react-redux";
import { SvgIconProps } from "@mui/material/SvgIcon";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import { Box, Typography } from "@mui/material";
import { RootState } from "../../store";
import { select_tree_item } from "./actions";
import { withRouter } from "react-router";

type testExplorerProps = {
  results: {
    cases_passed: number;
    cases_failed: number;
    total_cases: number;
    tests: {
      [id: string]: {
        Pass: string;
        Feedback: string;
        Errors: string;
        stdOut: string;
        stdErr: string;
      };
    };
  };
  select_tree_item: (item: number) => void;
};

type StyledTreeItemProps = TreeItemProps & {
  bgColor?: string;
  color?: string;
  labelIcon: React.ElementType<SvgIconProps>;
  labelInfo?: string;
  labelText: string;
};

function StyledTreeItem(props: StyledTreeItemProps) {
  const {
    bgColor,
    color,
    labelIcon: LabelIcon,
    labelInfo,
    labelText,
    ...other
  } = props;

  return (
    <TreeItem
      label={
        <Box sx={{ display: "flex", alignItems: "center", p: 0.5, pr: 0 }}>
          <Box component={LabelIcon} color="inherit" sx={{ mr: 1 }} />
          <Typography
            variant="body2"
            sx={{ fontWeight: "inherit", flexGrow: 1 }}
          >
            {labelText}
          </Typography>
          <Typography variant="caption" color="inherit">
            {labelInfo}
          </Typography>
        </Box>
      }
      {...other}
    />
  );
}

const check = () => {
  return (
    <CheckCircleOutlineRoundedIcon
      className="mr-2"
      fontSize="small"
      sx={{ color: "green" }}
    />
  );
};

const cross = () => {
  return (
    <HighlightOffRoundedIcon
      className="mr-2"
      fontSize="small"
      sx={{ color: "red" }}
    />
  );
};

const TestExplorer = ({ results, select_tree_item }: testExplorerProps) => {
  if (!results || !results.total_cases) {
    return (
      <TreeView
        aria-label="file system navigator"
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        sx={{
          height: 240,
          flexGrow: 1,
          minWidth: "200px",
          width: "100%",
        }}
        className="overflow-box"
      >
        <TreeItem nodeId="1" label="Test" />
      </TreeView>
    );
  }

  return (
    <div style={{ minWidth: "200px" }} className="overflow-box">
      <span className="p-2" style={{ color: "rgba(0, 0, 0, 0.6)" }}>
        {`${results.cases_passed}/${results.total_cases} passed (${(
          (results.cases_passed * 100) /
          results.total_cases
        ).toFixed(2)}%)`}
      </span>
      <TreeView
        aria-label="file system navigator"
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        sx={{
          width: "100%",
        }}
      >
        <StyledTreeItem
          labelIcon={results.cases_failed == 0 ? check : cross}
          nodeId="Test"
          labelText="Test"
          onClick={() => select_tree_item(-1)}
        >
          {Object.values(results.tests).map((result, index) => {
            return (
              <StyledTreeItem
                labelIcon={result.Pass ? check : cross}
                key={index}
                nodeId={`${index + 1}`}
                labelText={`Test case ${index + 1}`}
                onClick={() => select_tree_item(index)}
              />
            );
          })}
        </StyledTreeItem>
      </TreeView>
    </div>
  );
};

const mapStateToProps = (state: RootState, ownProps: any) => {
  if (
    state.code_run_results &&
    ownProps.match.params.question_id === state.code_run_results.question_id
  ) {
    return {
      results: state.code_run_results,
    };
  }
  return {
    results: {},
  };
};

export default withRouter(
  connect(mapStateToProps, {
    select_tree_item,
  })(TestExplorer)
);
