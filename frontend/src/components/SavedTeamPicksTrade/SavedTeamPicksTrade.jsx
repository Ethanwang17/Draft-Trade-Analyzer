import React from 'react';
import { List, Typography } from 'antd';
import './SavedTeamPicksTrade.css';

const { Title, Text } = Typography;

function SavedTeamPicksTrade({ teamId, type, tradeDetails }) {
	if (!tradeDetails || !tradeDetails.picksByTeam || !tradeDetails.picksByTeam[teamId]) {
		return (
			<div className="team-pick-section">
				<Title level={5}>{type === 'receiving' ? 'Receives:' : 'Sends:'}</Title>
				<Text type="secondary">No picks</Text>
			</div>
		);
	}

	const picks = tradeDetails.picksByTeam[teamId][type === 'receiving' ? 'receiving' : 'sending'];

	if (!picks || picks.length === 0) {
		return (
			<div className="team-pick-section">
				<Title level={5}>{type === 'receiving' ? 'Receives:' : 'Sends:'}</Title>
				<Text type="secondary">No picks</Text>
			</div>
		);
	}

	return (
		<div className="team-pick-section">
			<Title level={5}>{type === 'receiving' ? 'Receives:' : 'Sends:'}</Title>
			<List
				size="small"
				dataSource={picks}
				renderItem={(pick) => (
					<List.Item>
						<div className="pick-item">
							<img
								src={
									type === 'receiving'
										? pick.sending_team_logo
										: pick.sending_team_logo || 'default-logo.png'
								}
								alt={type === 'receiving' ? pick.sending_team_name : pick.sending_team_name}
								className="team-logo-small"
							/>
							<Text>
								{pick.year} Round {pick.round}
								{pick.pick_number ? ` (#${pick.pick_number})` : ''}
							</Text>
						</div>
					</List.Item>
				)}
			/>
		</div>
	);
}

export default SavedTeamPicksTrade;
