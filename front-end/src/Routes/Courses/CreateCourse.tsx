import React from "react";
import { connect } from "react-redux";

import CourseEditor from "./CourseEditor";
import { create_courses } from "./actions";
import { TabContext } from "../../components/util/Tabs";

type createCourseProps = {
  create_courses: (values: any, afterEffect: () => void) => {};
  editCourse?: () => {};
};

const CreateCourse = (props: createCourseProps) => {
  return (
    <TabContext.Consumer>
      {(values) => {
        const onSubmit = (v: any) => {
          if (!v.prerequisites) {
            v.prerequisites = [];
          }
          if (!v.categories) {
            v.categories = [];
          }
          if (!v.units) {
            v.units = [];
          }
          v.id = crypto.randomUUID();
          props.create_courses(v, () => {
            values.setValue(0);
          });
        };
        return (
          <CourseEditor
            title="Create course"
            course={{ id: crypto.randomUUID(), units: [] }}
            buttonText="Create course"
            onSubmit={onSubmit}
          />
        );
      }}
    </TabContext.Consumer>
  );
};

export default connect(null, {
  create_courses,
})(CreateCourse);
