import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Button, Empty, message, Modal, Spin, Divider } from 'antd';
import {
	SwapOutlined,
	DeleteOutlined,
	LoadingOutlined,
	ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

function SavedTrades() {
	const [trades, setTrades] = useState([]);
	const [loading, setLoading] = useState(true);
	const [expandedTradeId, setExpandedTradeId] = useState(null);
	const [tradeDetails, setTradeDetails] = useState(null);
	const [loadingDetails, setLoadingDetails] = useState(false);
	const navigate = useNavigate();

	// Fetch all saved trades
	useEffect(() => {
		const fetchSavedTrades = async () => {
			try {
				setLoading(true);
				const response = await fetch('/api/saved-trades');

				if (!response.ok) {
					throw new Error('Failed to fetch saved trades');
				}

				const data = await response.json();
				setTrades(data);
			} catch (error) {
				console.error('Error loading saved trades:', error);
				message.error('Failed to load saved trades');
			} finally {
				setLoading(false);
			}
		};

		fetchSavedTrades();
	}, []);

	// Fetch trade details
	const loadTradeDetails = async (tradeId) => {
		if (expandedTradeId === tradeId) {
			setExpandedTradeId(null);
			return;
		}

		try {
			setExpandedTradeId(tradeId);
			setLoadingDetails(true);

			const response = await fetch(`/api/saved-trades/${tradeId}`);

			if (!response.ok) {
				throw new Error('Failed to fetch trade details');
			}

			const data = await response.json();
			setTradeDetails(data);
		} catch (error) {
			console.error('Error loading trade details:', error);
			message.error('Failed to load trade details');
			setExpandedTradeId(null);
		} finally {
			setLoadingDetails(false);
		}
	};

	// Delete a trade
	const deleteTrade = async (tradeId, event) => {
		event.stopPropagation();

		try {
			const response = await fetch(`/api/saved-trades/${tradeId}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error('Failed to delete trade');
			}

			// Remove from local state
			setTrades(trades.filter((trade) => trade.id !== tradeId));
			if (expandedTradeId === tradeId) {
				setExpandedTradeId(null);
				setTradeDetails(null);
			}

			message.success('Trade deleted successfully');
		} catch (error) {
			console.error('Error deleting trade:', error);
			message.error('Failed to delete trade');
		}
	};

	// Format date for display
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

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
						<div className="pick-item">
							<img
								src={
									type === 'receiving'
										? pick.sending_team_logo
										: pick.receiving_team_logo || 'default-logo.png'
								}
								alt={type === 'receiving' ? pick.sending_team_name : pick.receiving_team_name}
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
		);
	};

	return (
		<div className="saved-trades">
			<Title level={2}>Saved Trade Concepts</Title>

			{loading ? (
				<div className="loading-container">
					<Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
					<p>Loading saved trades...</p>
				</div>
			) : trades.length === 0 ? (
				<Empty description="No saved trades yet" />
			) : (
				<div className="trades-list">
					{trades.map((trade) => (
						<Card
							key={trade.id}
							className="trade-card"
							onClick={() => loadTradeDetails(trade.id)}
							hoverable
						>
							<div className="trade-header">
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

							<div className="trade-teams">
								{trade.teams &&
									trade.teams.map((team, index) => (
										<React.Fragment key={team.id}>
											<div className="team">
												<img
													src={team.logo || 'default-logo.png'}
													alt={team.name}
													className="team-logo"
												/>
												<Text strong>{team.name}</Text>
											</div>

											{index < trade.teams.length - 1 && (
												<div className="trade-direction">
													<SwapOutlined className="swap-icon" />
												</div>
											)}
										</React.Fragment>
									))}
							</div>

							{expandedTradeId === trade.id && (
								<div className="trade-details">
									{loadingDetails ? (
										<Spin size="small" />
									) : (
										tradeDetails &&
										tradeDetails.teams && (
											<div className="all-team-details">
												{tradeDetails.teams.map((team) => (
													<div key={team.id} className="team-detail-section">
														<Divider orientation="left">{team.name}</Divider>

														<div className="team-picks-container">
															<div className="team-picks">
																<Title level={5}>Receives:</Title>
																{renderTeamPickDetails(team.id, 'receiving')}
															</div>

															<div className="team-picks">
																<Title level={5}>Sends:</Title>
																{renderTeamPickDetails(team.id, 'sending')}
															</div>
														</div>
													</div>
												))}
											</div>
										)
									)}
								</div>
							)}
						</Card>
					))}
				</div>
			)}

			<style jsx>{`
				.saved-trades {
					padding: 20px;
				}
				.trades-list {
					margin-top: 20px;
				}
				.trade-card {
					margin-bottom: 16px;
					border-radius: 8px;
				}
				.trade-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 16px;
				}
				.trade-teams {
					display: flex;
					align-items: center;
					justify-content: center;
					flex-wrap: wrap;
					gap: 10px;
				}
				.team {
					display: flex;
					flex-direction: column;
					align-items: center;
					min-width: 80px;
				}
				.team-logo {
					width: 60px;
					height: 60px;
					object-fit: contain;
					margin-bottom: 8px;
				}
				.team-logo-small {
					width: 24px;
					height: 24px;
					object-fit: contain;
					margin-right: 8px;
				}
				.trade-direction {
					display: flex;
					align-items: center;
				}
				.swap-icon {
					font-size: 24px;
				}
				.trade-details {
					margin-top: 16px;
					padding-top: 16px;
					border-top: 1px solid #f0f0f0;
				}
				.all-team-details {
					display: flex;
					flex-direction: column;
					gap: 20px;
				}
				.team-detail-section {
					margin-bottom: 12px;
				}
				.team-picks-container {
					display: flex;
					flex-wrap: wrap;
					gap: 20px;
					margin-top: 8px;
				}
				.team-picks {
					flex: 1;
					min-width: 200px;
				}
				.pick-item {
					display: flex;
					align-items: center;
				}
				.loading-container {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					padding: 40px;
				}
			`}</style>
		</div>
	);
}

export default SavedTrades;
