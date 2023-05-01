import React from "react";
import { connect } from "react-redux";

import CourseEditor from "./CourseEditor";
import { update_course } from "./actions";

import history from "../../history";
import { RootState } from "../../store";
import { selectors } from "../../orm/orm";

const EditCourse = (props: any) => {
  const onSubmit = (values: any) => {
    props.update_course(values, () => {
      history.push("/courses");
    });
  };
  if (!props.course) return null;

  return <CourseEditor course={props.course} onSubmit={onSubmit} />;
};

const mapStateToProps = (state: RootState, ownProps: any) => {
  return { course: selectors.course(state, ownProps.match.params.courseId) };
};

export default connect(mapStateToProps, {
  update_course,
})(EditCourse);
