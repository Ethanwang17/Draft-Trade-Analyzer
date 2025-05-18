import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

// Droppable Team Container
export const TeamPicksContainer = ({ id, teamLogo, teamName, picks, children }) => {
	const { setNodeRef } = useDroppable({
		id,
	});

	return (
		<div ref={setNodeRef} className="team-picks-container">
			<div className="team-header">
				<img src={teamLogo} alt="Team Logo" className="team-logo" style={{ width: '50px' }} />
				<h3 className="team-name">{teamName}</h3>
			</div>
			{children}
			{picks.length === 0 && <div className="empty-container-message">Drop picks here</div>}
		</div>
	);
};
