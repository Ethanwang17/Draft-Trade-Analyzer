import React from 'react';
import { Card, Col } from 'antd';
import TradeSummary from '../TradeSummary/TradeSummary';
import './TeamSummaryCard.css';

function TeamSummaryCard({ team, teamTradeData, onResetPick, colSize }) {
	return (
		<Col xs={24} sm={12} md={8} lg={colSize || 8}>
			<Card
				title={
					<div className="team-title-container">
						<img src={team.logo} alt={team.name} className="team-logo" />
						<span>{team.name}</span>
					</div>
				}
				className="team-card"
			>
				<TradeSummary tradeData={teamTradeData} onResetPick={onResetPick} showNetValue={true} />
			</Card>
		</Col>
	);
}

export default TeamSummaryCard;
