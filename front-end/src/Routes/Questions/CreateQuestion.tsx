import React from "react";
import { connect } from "react-redux";

import QuestionEditor from "./QuestionEditor";
import { create_questions } from "./actions";
import { question } from "../../apis";
import { TabContext } from "../../components/util/Tabs";
const description = `# Question template
<div>
  <hr />
</div>

Write a short question description here. You can use latex as well such as $e=mc^{2}$.

<h5>Sample input #1:</h5>
<div style="padding: 15px; border-radius: 5px; background-color: #f5f5f5;">
  <span style="color: orange;">n</span> = 1
</div>

<h5 style="margin-top: 15px">Sample output #1:</h5>
<div style="padding: 15px; border-radius: 5px; background-color: #f5f5f5;">
  1<span style="color: #006b04;"> // 1, 1</span>
</div>
`;
const CreateQuestion = (props: any) => {
  return (
    <TabContext.Consumer>
      {(value) => {
        return (
          <QuestionEditor
            question={{
              id: crypto.randomUUID().replaceAll("-", ""),
              name: "",
              description: description,
              allowed_imports: [],
              input_outputs: [{ input: "", output: "" }],
              question_count: 1,
              calls: [],
              operators: [],
              required_structures: [],
              illegal_structures: [],
              sample_solutions: [
                {
                  source: "def sample_0():\n\tpass",
                  errors: false,
                  expanded: true,
                },
              ],
              template: "def template():\n\tpass",
              categories: [],
              stderr: false,
              stdout: false,
              linting: false,
              timeout: 2,
              init: function () {
                this.sample_solutions[0].question_id = this.id;
                delete this.init;
                return this;
              },
            }.init()}
            handleSubmit={(question: question) => {
              props.create_questions([question], () => value.setValue(0));
            }}
          />
        );
      }}
    </TabContext.Consumer>
  );
};

export default connect(null, {
  create_questions,
})(CreateQuestion);
