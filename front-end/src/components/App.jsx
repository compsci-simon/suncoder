import React, { useEffect } from "react";
import { Router, Route } from "react-router-dom";
import { useSelector } from "react-redux";

import "./App.css";
import EditQuestion from "../Routes/Questions/EditQuestion";
import history from "../history";
import UserCode from "../Routes/Stats/UserCode";
import Bar from "./Bar";
import QuestionManager from "../Routes/Questions/QuestionManager";
import CourseManager from "../Routes/Courses/CourseManager";
import EditCourse from "../Routes/Courses/EditCourse";
import CourseNav from "../Routes/CourseExplorer/CourseNav";
import UnitManager from "../Routes/Units/UnitManager";
import EditUnit from "../Routes/Units/EditUnit";
import UnitQuestions from "../Routes/UnitQuestions/UnitQuestions";
import QuestionStats from "../Routes/Stats/QuestionStats";
import IDELayoutManager from "../Routes/ide/IDELayoutManager";
import UserManagement from "../Routes/Users/UserManagement";
import Settings from "../Routes/Settings/Settings";
import Misc from "../Routes/Fragments/Fragments";
import Backdrop from "./util/Backdrop";
import { selectors } from "../orm/orm";
import CodeRun from "../Routes/Stats/CodeRun";
import StatsManager from "../Routes/Stats/StatsManager";
import { MathJaxContext } from "better-react-mathjax";
import Test from "./Test";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import store from "../store";
import QuestionCharts from "../Routes/Stats/QuestionCharts";
import Login from "../Routes/Login/Login";

// rgb(100, 34, 59), #64223b
const theme = createTheme({
	palette: {
		primary: {
			main: "#64223b",
		},
	},
	typography: {
		fontFamily: "Raleway, Arial",
	},
});

const App = () => {
	const identity = useSelector((state) => state.identity);
	const backdropOpen = useSelector((state) => state.backdrop);

	useEffect(() => {
		selectors.users(store);
	}, []);

	return (
		<ThemeProvider theme={theme}>
			<MathJaxContext>
				<Router history={history}>
					{/* <Navbar /> */}
					{identity.id && (
						<Route
							path='/courses/:course_id/units/:unit_id/pools/:pool_id/questions/:question_id/IDE'
							exact
							component={IDELayoutManager}
						/>
					)}
					<Bar id='bar'>
						{identity.id ? (
							<React.Fragment>
								<Route path='/test' exact component={Test} />
								{/* Courses */}
								<Route
									path='/courses'
									exact
									component={CourseManager}
								/>
								<Route path='/' exact component={CourseNav} />
								<Route
									path='/courses/:courseId/edit'
									exact
									component={EditCourse}
								/>

								{/* Units */}
								<Route
									path='/units'
									exact
									component={UnitManager}
								/>
								<Route
									path='/units/:unitId'
									exact
									component={EditUnit}
								/>

								{/* Questions */}
								<Route
									path='/questions'
									exact
									component={QuestionManager}
								/>
								<Route
									path='/questions/:qid'
									exact
									component={EditQuestion}
								/>
								<Route
									path='/courses/:course_id/units/:unit_id/questions'
									exact
									component={UnitQuestions}
								/>

								{/* MISC */}
								<Route path='/misc' exact component={Misc} />

								{/* Stats */}
								<Route
									path='/stats'
									exact
									component={StatsManager}
								/>
								<Route
									path='/stats/:question_id'
									exact
									component={QuestionStats}
								/>
								<Route
									path='/stats/:question_id/chart'
									exact
									component={QuestionCharts}
								/>
								<Route
									path='/stats/:question_id/user_code/:user_code_id'
									exact
									component={UserCode}
								/>
								<Route
									path='/stats/:question_id/user_code/:user_code_id/reconstruct/:keystroke'
									exact
									component={CodeRun}
								/>
								<Route
									path='/stats/:question_id/user_code/:user_code_id/code_run/:code_run_id'
									exact
									component={CodeRun}
								/>

								{/* Users */}
								<Route
									path='/users/edit'
									exact
									component={UserManagement}
								/>

								{/* Settings */}
								<Route
									path='/settings'
									exact
									component={Settings}
								/>
							</React.Fragment>
						) : (
							// <div
							//   className='w-100 h-100 position-relative'
							// >
							//   <img
							//     className='m-auto fixed-bottom h-100 position-absolute'
							//     src='./assets/denied.svg'
							//   />
							// </div>
							<Login />
						)}
					</Bar>
				</Router>
				<Backdrop open={backdropOpen} />
			</MathJaxContext>
		</ThemeProvider>
	);
};

export default App;
