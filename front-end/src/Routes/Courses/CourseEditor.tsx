import React, { Dispatch, SetStateAction } from "react";
import { Form as FinalForm } from "react-final-form";
import { TextField } from "mui-rff";
import { connect } from "react-redux";

import Stepper from "../../components/stepper/Stepper";
import { item } from "../../components/util/FilterChipBox";
import arrayMutators from "final-form-arrays";
import setFieldTouched from "final-form-set-field-touched";
import { FieldArray } from "react-final-form-arrays";
import { ValidationErrors } from "final-form";
import { selectors } from "../../orm/orm";
import { RootState } from "../../store";
import FlowStep from "./FlowStep";
import GeneralStep from "./GeneralStep";
import { cycles, unitPrereqCycle } from "../helper";

type courseType = {
  name: string;
  id: string;
  prerequisites: any;
  units: any;
};

type courseEditorProps = {
  courses: courseType[];
  courses_to_show: courseType[];
  course: courseType;
  units: any;
  onSubmit: (values: any) => void;
  setValue: Dispatch<SetStateAction<number>>;
};

type errorType = {
  name?: string;
  prerequisites?: {
    [key: string]: item;
  };
  units?: string;
};

const CourseEditor = (props: courseEditorProps) => {
  const validate: (values: any) => ValidationErrors = (values) => {
    let errors: any = {};
    if (!values.name) {
      errors.name = "Course name required";
    }
    let c = cycles(values, props.courses);
    if (c && c["offending"]) {
      errors["prerequisites"] = c;
    } else {
      delete errors["prerequisites"];
    }
    c = unitPrereqCycle(values.units);
    if (c) {
      errors["units"] = true;
    } else {
      delete errors["units"];
    }
    return errors;
  };

  return (
    <FinalForm
      onSubmit={props.onSubmit}
      mutators={{
        ...arrayMutators,
        setFieldTouched,
      }}
      initialValues={props.course}
      validate={validate}
      render={(formProps) => (
        <form onSubmit={formProps.handleSubmit} className="h-100 pt-2">
          <Stepper
            steps={[
              {
                label: "Select prerequisites and units",
                canSkip: false,
                fields: ["name", "prerequisites"],
                node: (
                  <GeneralStep
                    course={props.course}
                    courses={props.courses}
                    courses_to_show={props.courses_to_show}
                    units={props.units}
                    formProps={formProps}
                  />
                ),
              },
              {
                label: "Specify unit hierarchy",
                canSkip: false,
                fields: ["units"],
                node: (
                  <FieldArray name="units">
                    {({ fields, meta }) => {
                      return <FlowStep meta={meta} fields={fields} />;
                    }}
                  </FieldArray>
                ),
              },
            ]}
            formProps={formProps}
            setFieldTouched={setFieldTouched}
          />
        </form>
      )}
    />
  );
};

const mapStateToProps = (state: RootState, ownProps: any) => {
  let units: {
    [key: string]: any;
  } = {};
  let all_units = selectors.units(state);
  for (let unit of all_units) {
    if (unit.course_id === null) {
      units[unit.id] = unit;
    } else if (unit.course_id === ownProps.course.id) {
      units[unit.id] = unit;
    }
  }

  let courses = selectors.courses(state);
  let courses_to_show: any = [];
  for (let course of courses) {
    if (ownProps.course.id !== course.id) {
      courses_to_show.push(JSON.parse(JSON.stringify(course)));
    }
  }

  return { courses, courses_to_show, units };
};

export default connect(mapStateToProps, {})(CourseEditor);
