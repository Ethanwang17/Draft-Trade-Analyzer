import React, { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TradeSummary from '../Summary/TradeSummary/TradeSummary';
import './TeamCard.css';

// Draft Pick component
export const DraftPick = ({ id, content, teamLogo, className }) => {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`draft-pick ${className || ''}`}
			{...attributes}
			{...listeners}
		>
			{teamLogo && <img src={teamLogo} alt="Team Logo" className="draft-pick-team-logo" />}
			<span>{content}</span>
		</div>
	);
};

// Draft Pick Overlay
export const DraftPickOverlay = ({ content, teamLogo }) => {
	return (
		<div className="draft-pick draft-pick-overlay">
			{teamLogo && <img src={teamLogo} alt="Team Logo" className="draft-pick-team-logo" />}
			<span>{content}</span>
		</div>
	);
};

// Pick Value Display component
const PickValueDisplay = ({ pickNumber, valuation = 1 }) => {
	const [pickValue, setPickValue] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (pickNumber) {
			setLoading(true);
			// Use the appropriate API endpoint based on whether we have a valuation model
			const apiUrl =
				valuation === 1
					? `/api/pick-value/${pickNumber}`
					: `/api/pick-value/${pickNumber}/${valuation}`;

			fetch(apiUrl)
				.then((response) => {
					if (!response.ok) {
						throw new Error('Pick value not found');
					}
					return response.json();
				})
				.then((data) => {
					setPickValue(data);
					setLoading(false);
				})
				.catch((error) => {
					console.error('Error fetching pick value:', error);
					setLoading(false);
				});
		}
	}, [pickNumber, valuation]);

	if (!pickNumber || loading) {
		return <span className="pick-value-loading">--</span>;
	}

	if (!pickValue) {
		return null;
	}

	return (
		<span className="pick-value-display">
			Value: <strong>{pickValue.value}</strong>
		</span>
	);
};

// Trade Summary Value component to show total values
const TradeSummaryTotal = ({ picks, direction }) => {
	const [totalValue, setTotalValue] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!picks || picks.length === 0) {
			setTotalValue(0);
			return;
		}

		setLoading(true);
		const fetchValues = async () => {
			try {
				let total = 0;
				// Fetch value for each pick
				for (const pick of picks) {
					if (pick.pick_number) {
						const valuation = pick.valuation || 1;
						const apiUrl =
							valuation === 1
								? `/api/pick-value/${pick.pick_number}`
								: `/api/pick-value/${pick.pick_number}/${valuation}`;

						const response = await fetch(apiUrl);
						if (response.ok) {
							const data = await response.json();
							total += parseFloat(data.value);
						}
					}
				}
				setTotalValue(total);
				setLoading(false);
			} catch (error) {
				console.error('Error calculating total value:', error);
				setLoading(false);
			}
		};

		fetchValues();
	}, [picks]);

	if (loading) {
		return <div className="trade-summary-value-loading">Calculating...</div>;
	}

	if (totalValue === null || totalValue === 0) {
		return null;
	}

	// Display a green + for receiving and a red - for giving
	const prefix =
		direction === 'incoming' ? (
			<span className="value-prefix positive">+</span>
		) : (
			<span className="value-prefix negative">-</span>
		);

	return (
		<div className={`trade-summary-value ${direction}`}>
			<span>Total Value:</span>
			<strong>
				{prefix} {totalValue}
			</strong>
		</div>
	);
};

// Droppable Team Container
export const TeamPicksContainer = ({
	id,
	teamLogo,
	teamName,
	picks,
	children,
	teamId,
	tradeData,
	onResetPick,
}) => {
	const { setNodeRef } = useDroppable({
		id,
	});

	// Use trade data if provided, otherwise calculate basic info
	const tradeSummary = React.useMemo(() => {
		if (tradeData) {
			return {
				incoming: tradeData.incoming || [],
				outgoing: tradeData.outgoing || [],
			};
		}

		// Fallback to basic calculation (incoming only)
		const incoming = picks.filter((pick) => pick.originalTeamId && pick.originalTeamId !== teamId);

		return { incoming, outgoing: [] };
	}, [picks, teamId, tradeData]);

	return (
		<div ref={setNodeRef} className="team-picks-container">
			<div className="team-header">
				<img src={teamLogo} alt="Team Logo" className="team-logo" style={{ width: '50px' }} />
				<h3 className="team-name">{teamName}</h3>
			</div>

			{/* Trade summary section */}
			<TradeSummary tradeData={tradeSummary} onResetPick={onResetPick} />

			<div className="team-picks-content">
				{children}
				{picks.length === 0 && <div className="empty-container-message">Drop picks here</div>}
			</div>
		</div>
	);
};
