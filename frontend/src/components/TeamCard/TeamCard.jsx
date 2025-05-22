import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TradeSummary from '../Summary/TradeSummary/TradeSummary';
import './TeamCard.css';

// Sortable draft pick that supports drag-and-drop with visual feedback
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

// Overlay used when a pick is being dragged
export const DraftPickOverlay = ({ content, teamLogo }) => {
	return (
		<div className="draft-pick draft-pick-overlay">
			{teamLogo && <img src={teamLogo} alt="Team Logo" className="draft-pick-team-logo" />}
			<span>{content}</span>
		</div>
	);
};

// Droppable container for team picks, displays trade summary and pick slots
export const TeamPicksContainer = ({
	id,
	teamLogo,
	teamName,
	picks,
	children,
	teamId,
	tradeData,
	onResetPick,
	selectedValuation,
}) => {
	const { setNodeRef } = useDroppable({
		id,
	});

	// Memoized trade summary to avoid recalculating on every render
	const tradeSummary = React.useMemo(() => {
		if (tradeData) {
			return {
				incoming: tradeData.incoming || [],
				outgoing: tradeData.outgoing || [],
			};
		}

		// Fallback summary: only show incoming picks from other teams
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
			<TradeSummary
				tradeData={tradeSummary}
				onResetPick={onResetPick}
				selectedValuation={selectedValuation}
			/>

			<div className="team-picks-content">
				{children}
				{picks.length === 0 && <div className="empty-container-message">Drop picks here</div>}
			</div>
		</div>
	);
};
