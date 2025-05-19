import React from 'react';
import { Card, List, Typography, Button, Empty, Spin } from 'antd';
import { SwapOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { useSavedTrades, useTradeDetails, useTradeDelete, useTradeUtils } from '../hooks';

const { Title, Text } = Typography;

function SavedTrades() {
	const { trades, loading, setTrades } = useSavedTrades();
	const {
		expandedTradeId,
		tradeDetails,
		loadingDetails,
		loadTradeDetails,
		setExpandedTradeId,
		setTradeDetails,
	} = useTradeDetails();
	const deleteTrade = useTradeDelete(
		trades,
		setTrades,
		expandedTradeId,
		setExpandedTradeId,
		setTradeDetails
	);
	const { formatDate, getTeamPickDetails } = useTradeUtils();
	const _navigate = useNavigate();

	// Render the pick details for a specific team
	const renderTeamPickDetails = (teamId, type) => {
		if (!tradeDetails || !tradeDetails.picksByTeam || !tradeDetails.picksByTeam[teamId]) {
			return <Text type="secondary">No picks</Text>;
		}

		const picks = tradeDetails.picksByTeam[teamId][type === 'receiving' ? 'receiving' : 'sending'];

		if (!picks || picks.length === 0) {
			return <Text type="secondary">No picks</Text>;
		}

		return (
			<List
				size="small"
				dataSource={picks}
				renderItem={(pick) => (
					<List.Item>
						<div className="st-pick-item">
							<img
								src={
									type === 'receiving'
										? pick.sending_team_logo
										: pick.sending_team_logo || 'default-logo.png'
								}
								alt={type === 'receiving' ? pick.sending_team_name : pick.sending_team_name}
								className="st-team-logo-small"
							/>
							<Text>
								{pick.year} Round {pick.round}
								{pick.pick_number ? ` (#${pick.pick_number})` : ''}
							</Text>
						</div>
					</List.Item>
				)}
			/>
		);
	};

	return (
		<div className="st-container">
			<Title level={2}>Saved Trade Concepts</Title>

			{loading ? (
				<div className="st-loading-container">
					<Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
					<p>Loading saved trades...</p>
				</div>
			) : trades.length === 0 ? (
				<Empty description="No saved trades yet" />
			) : (
				<div className="st-trades-list">
					{trades.map((trade) => (
						<Card
							key={trade.id}
							className={`st-trade-card team-count-${trade.teams ? trade.teams.length : 0}`}
							onClick={() => loadTradeDetails(trade.id)}
							hoverable
						>
							<div className="st-trade-header">
								<div className="trade-title">
									<Title level={4}>{trade.trade_name || `Trade #${trade.id}`}</Title>
									<Text type="secondary">{formatDate(trade.created_at)}</Text>
								</div>
								<Button
									type="text"
									danger
									icon={<DeleteOutlined />}
									onClick={(e) => deleteTrade(trade.id, e)}
								/>
							</div>

							<div className="st-trade-teams">
								{trade.teams &&
									trade.teams.map((team, index) => (
										<React.Fragment key={team.id}>
											<div className="st-team">
												<img
													src={team.logo || 'default-logo.png'}
													alt={team.name}
													className="st-team-logo"
												/>
												<Text strong>{team.name}</Text>

												{expandedTradeId === trade.id && !loadingDetails && tradeDetails && (
													<div className="st-team-picks-inline">
														<div className="st-team-pick-section">
															<Title level={5}>Receives:</Title>
															{renderTeamPickDetails(team.id, 'receiving')}
														</div>
														<div className="st-team-pick-section">
															<Title level={5}>Sends:</Title>
															{renderTeamPickDetails(team.id, 'sending')}
														</div>
													</div>
												)}
											</div>

											{index < trade.teams.length - 1 && (
												<div className="st-trade-direction">
													<SwapOutlined className="st-swap-icon" />
												</div>
											)}
										</React.Fragment>
									))}
							</div>

							{expandedTradeId === trade.id && loadingDetails && (
								<div className="st-loading-details">
									<Spin size="small" />
								</div>
							)}
						</Card>
					))}
				</div>
			)}
		</div>
	);
}

export default SavedTrades;
