import React from "react";
import { connect } from "react-redux";

import QuestionEditor from "./QuestionEditor";
import history from "../../history";
import { selectors } from "../../orm/orm";
import { update_question } from "./actions";

const EditQuestion = (props: any) => {
  if (props.question == undefined) {
    return <div>Loading...</div>;
  }

  return (
    <React.Fragment>
      <QuestionEditor
        question={props.question}
        handleSubmit={(question: any) => {
          props.update_question(question);
          history.push("/questions");
        }}
      />
    </React.Fragment>
  );
};

const mapStateToProps = (state: any, ownProps: any) => {
  return { question: selectors.question(state, ownProps.match.params.qid) };
};

export default connect(mapStateToProps, {
  update_question,
})(EditQuestion);
