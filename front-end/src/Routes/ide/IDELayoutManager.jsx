import React, { useState } from "react";

import { withRouter } from "react-router-dom";
import { compose } from "redux";
import { connect } from "react-redux";

import QuestionStatement from "./QuestionStatement";
import IDE from "./IDE";

import Split from "react-split";
import { selectors } from "../../orm/orm";
import { List, ListItemButton } from "@mui/material";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import Divider from "@mui/material/Divider";
import history from "../../history";

const IDELayoutManager = (props) => {
	const [fullscreen, setFullscreen] = useState(false);
	const [showExplorer, toggleExplorer] = useState(true);

	return (
		<div
			style={{
				height: "100%",
				width: "100%",
				backgroundColor: "white",
				display: "flex",
			}}
		>
			<List sx={{ borderRight: 1, borderColor: "divider" }}>
				<ListItemButton
					className='py-3'
					onClick={() => history.goBack()}
				>
					<ArrowBackIosNewIcon fontSize='small' />
				</ListItemButton>
				<Divider />
				<ListItemButton
					className='py-3'
					onClick={() => setFullscreen(!fullscreen)}
				>
					{fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
				</ListItemButton>
				<Divider />
				<ListItemButton
					className='py-3'
					onClick={() => toggleExplorer(!showExplorer)}
				>
					<FolderOpenOutlinedIcon />
				</ListItemButton>
			</List>
			<Split
				gutterSize={6}
				minSize={!fullscreen ? [200, 300] : [200, 0]}
				sizes={!fullscreen ? [60, 40] : [100, 0]}
				direction='horizontal'
				style={{
					height: "100%",
					width: "100%",
					backgroundColor: "white",
				}}
				className='split'
				onDragStart={() => {
					setFullscreen(false);
				}}
			>
				<IDE
					fullscreen={fullscreen}
					setFullscreen={setFullscreen}
					showExplorer={showExplorer}
					question={props.question}
				/>
				<QuestionStatement question={props.question} />
			</Split>
		</div>
	);
};

const mapStateToProps = (state, ownProps) => {
	const qid = ownProps.match.params.question_id;
	return { question: selectors.question(state, qid) };
};

export default compose(
	withRouter,
	connect(mapStateToProps, {})
)(IDELayoutManager);
