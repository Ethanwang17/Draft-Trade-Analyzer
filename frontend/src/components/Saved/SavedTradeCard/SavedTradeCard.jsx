import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Button, Spin } from 'antd';
import { DeleteOutlined, SwapOutlined, LoadingOutlined } from '@ant-design/icons';
import LoadTradeButton from '../../LoadTradeButton/LoadTradeButton';
import SavedTeamDisplay from '../SavedTeamDisplay/SavedTeamDisplay';
import TradeSummary from '../../Summary/TradeSummary/TradeSummary';
import { useTradeEvaluation } from '../../../hooks/AnalyzeTradeHooks/useTradeEvaluation';
import TradeBalanceBadge from '../../TradeBalanceBadge/TradeBalanceBadge';
import './SavedTradeCard.css';

const { Title, Text } = Typography;

function SavedTradeCard({
	trade,
	expandedTradeIds,
	loadingDetails,
	tradeDetails,
	deleteTrade,
	loadTradeDetails,
	formatDate,
	selectedValuation = 1,
}) {
	const [pickValues, setPickValues] = useState({});
	const [loadingValues, setLoadingValues] = useState(false);
	const [tradeDataForEvaluation, setTradeDataForEvaluation] = useState(null);
	const [isExpanded, setIsExpanded] = useState(false);
	const [contentVisible, setContentVisible] = useState(false);

	// Determine if this card is expanded or collapsed based on external state
	useEffect(() => {
		const isCardExpanded = expandedTradeIds.includes(trade.id);
		if (isCardExpanded) {
			setIsExpanded(true);
			// Slight delay to allow for smooth transition after the card is expanded
			setTimeout(() => setContentVisible(true), 50);
		} else {
			setContentVisible(false);
			// Allow time for fade-out animation before collapsing
			setTimeout(() => setIsExpanded(false), 300);
		}
	}, [expandedTradeIds, trade.id]);

	// Construct the teamGroups structure used by the evaluation hook from raw trade data
	const getTradeDataForEvaluation = useCallback(() => {
		if (!tradeDetails || !tradeDetails[trade.id] || !tradeDetails[trade.id].picksByTeam)
			return null;

		const currentTradeDetails = tradeDetails[trade.id];

		// Format the team groups in the structure expected by useTradeEvaluation
		const teamGroups = Object.entries(currentTradeDetails.picksByTeam).map(
			([teamId, teamPicks]) => {
				// Find team name from the main trade.teams data as fallback
				const teamFromMainData = trade.teams?.find((t) => t.id.toString() === teamId.toString());
				const teamName = teamPicks.team_name || teamFromMainData?.name || `Team ${teamId}`;

				return {
					teamId,
					name: teamName,
					picks: [
						...(teamPicks.sending || []).map((pick) => ({
							...pick,
							id: pick.draft_pick_id,
							originalTeamId: pick.sending_team_id,
							// Don't override value here - let useTradeEvaluation handle it
						})),
						...(teamPicks.receiving || []).map((pick) => ({
							...pick,
							id: pick.draft_pick_id,
							originalTeamId: pick.sending_team_id,
							// Don't override value here - let useTradeEvaluation handle it
						})),
					],
				};
			}
		);

		return { teamGroups };
	}, [tradeDetails, trade.id, trade.teams]);

	// Update trade data for evaluation when pickValues change
	useEffect(() => {
		if (
			expandedTradeIds.includes(trade.id) &&
			!loadingDetails[trade.id] &&
			tradeDetails[trade.id] &&
			!loadingValues
		) {
			setTradeDataForEvaluation(getTradeDataForEvaluation());
		}
	}, [
		pickValues,
		tradeDetails,
		loadingDetails,
		expandedTradeIds,
		trade.id,
		loadingValues,
		getTradeDataForEvaluation,
	]);

	// Use the trade evaluation hook
	const { evaluateTrade } = useTradeEvaluation(tradeDataForEvaluation, pickValues);

	React.useEffect(() => {
		if (
			expandedTradeIds.includes(trade.id) &&
			!loadingDetails[trade.id] &&
			tradeDetails[trade.id]
		) {
			console.log('TradeDetails for card:', tradeDetails[trade.id]);
		}
	}, [expandedTradeIds, loadingDetails, tradeDetails, trade.id]);

	// Fetch all draft pick values used for evaluation, deduplicated by ID
	const fetchPickValues = useCallback(async () => {
		if (!tradeDetails[trade.id] || !tradeDetails[trade.id].picksByTeam) return;

		const currentTradeDetails = tradeDetails[trade.id];

		setLoadingValues(true);
		const valuePromises = [];
		const pickData = {};

		// Collect all picks from all teams
		const allPicks = [];
		Object.values(currentTradeDetails.picksByTeam).forEach((teamPicks) => {
			if (teamPicks.sending) allPicks.push(...teamPicks.sending);
			if (teamPicks.receiving) allPicks.push(...teamPicks.receiving);
		});

		// Get unique picks by draft_pick_id
		const uniquePicks = allPicks.filter(
			(pick, index, self) => index === self.findIndex((p) => p.draft_pick_id === pick.draft_pick_id)
		);

		// Create promises for each pick
		for (const pick of uniquePicks) {
			const pickId = pick.draft_pick_id;
			let apiUrl;

			if (pick.pick_number) {
				apiUrl = `/api/pick-value/${pick.pick_number}/${selectedValuation}`;
			} else {
				apiUrl = `/api/future-pick-value/${pick.year}/${pick.round}/${selectedValuation}`;
			}

			const promise = fetch(apiUrl)
				.then((res) => (res.ok ? res.json() : { value: 0 }))
				.then((data) => {
					const value = parseFloat(data.value) || 0;

					// Store values in multiple formats to match useTradeEvaluation expectations
					pickData[pickId] = value; // original format for compatibility

					// If it's a numbered pick, also store by pick_number (for analyze page compatibility)
					if (pick.pick_number) {
						pickData[pick.pick_number] = value;
					}

					// If it's a future pick, also store by future key format (for analyze page compatibility)
					if (pick.year && pick.round) {
						const futureKey = `future_${pick.year}_${pick.round}`;
						pickData[futureKey] = value;
					}
				})
				.catch((err) => {
					console.error(`Error fetching value for pick ${pickId}:`, err);
					pickData[pickId] = 0;

					// Also set fallback values for the additional keys
					if (pick.pick_number) {
						pickData[pick.pick_number] = 0;
					}
					if (pick.year && pick.round) {
						const futureKey = `future_${pick.year}_${pick.round}`;
						pickData[futureKey] = 0;
					}
				});

			valuePromises.push(promise);
		}

		// Wait for all value fetches to complete
		await Promise.all(valuePromises);
		setPickValues(pickData);
		setLoadingValues(false);
	}, [tradeDetails, trade.id, selectedValuation]);

	// Fetch pick values when tradeDetails or valuation model changes
	useEffect(() => {
		if (
			expandedTradeIds.includes(trade.id) &&
			!loadingDetails[trade.id] &&
			tradeDetails[trade.id]
		) {
			fetchPickValues();
		}
	}, [
		tradeDetails,
		selectedValuation,
		expandedTradeIds,
		trade.id,
		loadingDetails,
		fetchPickValues,
	]);

	// Format pick data into TradeSummary-friendly shape with team logos and values
	const formatPicksForTeam = (teamId) => {
		if (
			!tradeDetails[trade.id] ||
			!tradeDetails[trade.id].picksByTeam ||
			!tradeDetails[trade.id].picksByTeam[teamId]
		) {
			return { outgoing: [], incoming: [] };
		}

		const teamPicks = tradeDetails[trade.id].picksByTeam[teamId];

		// Helper function to get pick value using the same logic as useTradeEvaluation
		const getPickValue = (pick) => {
			if (!pickValues) return 0;

			// For picks with a specific pick number
			if (pick.pick_number && pickValues[pick.pick_number]) {
				return pickValues[pick.pick_number];
			}

			// For future picks, try to get value by pick id
			if (pick.draft_pick_id && pickValues[pick.draft_pick_id]) {
				return pickValues[pick.draft_pick_id];
			}

			// For future picks, try to get value by year and round
			if (pick.year && pick.round) {
				const futureKey = `future_${pick.year}_${pick.round}`;
				if (pickValues[futureKey]) {
					return pickValues[futureKey];
				}
			}

			return 0;
		};

		return {
			outgoing: teamPicks.sending.map((pick) => ({
				...pick,
				id: pick.draft_pick_id,
				content: `${pick.year} Round ${pick.round}${pick.pick_number ? ` (#${pick.pick_number})` : ''}`,
				originalTeamLogo: pick.sending_team_logo,
				fromTeam: pick.sending_team_name,
				toTeam: pick.receiving_team_name,
				value: getPickValue(pick),
			})),
			incoming: teamPicks.receiving.map((pick) => ({
				...pick,
				id: pick.draft_pick_id,
				content: `${pick.year} Round ${pick.round}${pick.pick_number ? ` (#${pick.pick_number})` : ''}`,
				originalTeamLogo: pick.sending_team_logo,
				fromTeam: pick.sending_team_name,
				toTeam: pick.receiving_team_name,
				value: getPickValue(pick),
			})),
		};
	};

	const handleCardClick = () => {
		loadTradeDetails(trade.id);
	};

	return (
		<Card
			key={trade.id}
			className={`saved-trade-card team-count-${trade.teams ? trade.teams.length : 0} ${isExpanded ? 'expanded' : ''}`}
			onClick={handleCardClick}
			hoverable
			style={{
				transition: 'box-shadow 0.3s ease',
			}}
		>
			<div className="saved-trade-header">
				<div className="trade-title">
					<Title level={4}>{trade.trade_name || `Trade #${trade.id}`}</Title>
					<Text type="secondary">{formatDate(trade.created_at)}</Text>
				</div>
				{/* Only render the balance badge once values and details are loaded */}
				{isExpanded &&
					contentVisible &&
					!loadingDetails[trade.id] &&
					tradeDetails[trade.id] &&
					!loadingValues && (
						<div
							className="trade-evaluation"
							style={{
								opacity: contentVisible ? 1 : 0,
								transform: contentVisible ? 'translateY(0)' : 'translateY(10px)',
							}}
						>
							<TradeBalanceBadge tradeBalance={evaluateTrade()} />
						</div>
					)}
				<div className="saved-trade-actions">
					<LoadTradeButton tradeId={trade.id} />
					<Button
						type="text"
						danger
						icon={<DeleteOutlined />}
						onClick={(e) => deleteTrade(trade.id, e)}
					/>
				</div>
			</div>

			<div className="saved-trade-teams">
				{trade.teams &&
					trade.teams.map((team, index) => (
						<React.Fragment key={team.id}>
							<div className="saved-trade-team">
								<SavedTeamDisplay team={team} />

								{isExpanded && (
									<div
										className="saved-trade-team-details"
										style={{
											opacity: contentVisible ? 1 : 0,
											overflow: contentVisible ? 'visible' : 'hidden',
											transition: 'opacity 0.3s ease, max-height 0.3s ease-in-out',
											transformOrigin: 'top',
											width: '100%',
										}}
									>
										{!loadingDetails[trade.id] && tradeDetails[trade.id] && (
											<>
												{loadingValues ? (
													<div
														className="loading-values"
														style={{
															opacity: contentVisible ? 1 : 0,
															transform: contentVisible ? 'scale(1)' : 'scale(0.95)',
														}}
													>
														<Spin size="small" />
														<span>Loading values...</span>
													</div>
												) : (
													<div
														style={{
															opacity: contentVisible ? 1 : 0,
															transform: contentVisible ? 'translateY(0)' : 'translateY(10px)',
															transition: 'opacity 0.3s ease, transform 0.3s ease',
															transitionDelay: '0.1s',
															width: '100%',
														}}
													>
														<TradeSummary
															tradeData={formatPicksForTeam(team.id)}
															showNetValue={true}
															selectedValuation={selectedValuation}
															showRemoveIcon={false}
														/>
													</div>
												)}
											</>
										)}
									</div>
								)}
							</div>

							{index < trade.teams.length - 1 && (
								<div className="saved-trade-direction">
									<SwapOutlined className="saved-trade-icon" />
								</div>
							)}
						</React.Fragment>
					))}
			</div>

			{isExpanded && loadingDetails[trade.id] && (
				<div
					className="saved-trade-loading"
					style={{
						opacity: contentVisible ? 1 : 0,
					}}
				>
					<Spin size="small" />
				</div>
			)}
		</Card>
	);
}

export default SavedTradeCard;
