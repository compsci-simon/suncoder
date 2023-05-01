import React from "react";
import { delete_object } from "../../action";
import { connect } from "react-redux";

import FragmentManager from "./FragmentManager";
import { selectors } from "../../orm/orm";
import { RootState } from "../../store";

const CategoriesEditor = (props: any) => {
  const deleteCategory = (category_object: { name: string }) => {
    props.delete_object("categories", [category_object]);
  };

  return (
    <FragmentManager
      fragments={props.categories}
      fragment_name="Category"
      tablename="categories"
      deleteFragment={deleteCategory}
    />
  );
};

const mapStateToProps = (state: RootState) => {
  return { categories: selectors.categories(state) };
};

export default connect(mapStateToProps, {
  delete_object,
})(CategoriesEditor);
