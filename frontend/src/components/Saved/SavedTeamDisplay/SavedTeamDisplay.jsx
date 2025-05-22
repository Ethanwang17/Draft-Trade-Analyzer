import React from 'react';
// Display a team's logo and name for use in SavedTradeCard
import { Typography } from 'antd';
import './SavedTeamDisplay.css';

const { Text } = Typography;

function SavedTeamDisplay({ team }) {
	return (
		<div className="team-display">
			<img src={team.logo || 'default-logo.png'} alt={team.name} className="team-logo" />
			<Text strong>{team.name}</Text>
		</div>
	);
}

export default SavedTeamDisplay;
