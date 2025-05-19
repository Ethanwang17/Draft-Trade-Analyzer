import React from 'react';
import { Typography } from 'antd';
import './TeamDisplay.css';

const { Text } = Typography;

function TeamDisplay({ team }) {
	return (
		<div className="team-display">
			<img src={team.logo || 'default-logo.png'} alt={team.name} className="team-logo" />
			<Text strong>{team.name}</Text>
		</div>
	);
}

export default TeamDisplay;
