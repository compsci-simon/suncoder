import React from "react";
import Tabs from "../../components/util/Tabs";
import CourseRegistration from "./CourseRegistration";
import ChangeUserSettings from "./ChangeUserSettings";

const Settings = () => {
  return (
    <Tabs
      tabs={[
        {
          name: "Course Registration",
          content: <CourseRegistration />,
        },
        {
          name: "Change profile settings",
          content: <ChangeUserSettings />,
        },
      ]}
    />
  );
};

export default Settings;
