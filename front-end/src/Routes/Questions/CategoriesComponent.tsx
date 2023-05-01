import React from "react";
import { FieldArray } from "react-final-form-arrays";
import { connect } from "react-redux";
import FilterChipBox from "../../components/util/FilterChipBox";
import { selectors } from "../../orm/orm";
import { RootState } from "../../store";

const CategoriesComponent = (props: any) => {
  return (
    <FieldArray name="categories">
      {({ fields }) => {
        return (
          <FilterChipBox
            allItems={props.categories}
            selectedItems={fields.value}
            selectItem={fields.push}
            deselectItem={fields.remove}
            id_key={"name"}
          />
        );
      }}
    </FieldArray>
  );
};

const mapStateToProps = (state: RootState) => {
  return { categories: selectors.categories(state) };
};

export default connect(mapStateToProps, {})(CategoriesComponent);
