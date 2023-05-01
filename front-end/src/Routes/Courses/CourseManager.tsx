import React, { useState } from "react";
import CreateCourse from "./CreateCourse";
import CourseFeed from "./CourseFeed";
import "./CourseManager.css";
import Tabs from "../../components/util/Tabs";

const CourseManager = () => {
  return (
    <Tabs
      tabs={[
        {
          name: "Course Feed",
          content: <CourseFeed />,
        },
        {
          name: "Create Course",
          content: <CreateCourse />,
        },
      ]}
    />
  );
};

export default CourseManager;
