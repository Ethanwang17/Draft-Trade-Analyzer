import React, { useMemo } from 'react';
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragOverlay,
} from '@dnd-kit/core';
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
	arrayMove,
} from '@dnd-kit/sortable';

import { DraftPick, DraftPickOverlay, TeamPicksContainer } from './DraftComponents';
import TeamSelector from './TeamSelector';

const TradeBuilder = ({
	teams,
	loading,
	teamGroups,
	setTeamGroups,
	getTeamGroupClass,
	isResetting,
}) => {
	const [activeId, setActiveId] = React.useState(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			// Disable dragging while animation is in progress
			activationConstraint: {
				delay: isResetting ? 1000 : 0, // Prevent dragging while reset animation is happening
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Find the active item for the drag overlay
	const activeItem = useMemo(() => {
		if (!activeId) return null;

		for (const group of teamGroups) {
			const item = group.picks.find((item) => item.id === activeId);
			if (item) return item;
		}

		return null;
	}, [activeId, teamGroups]);

	// Handle drag start
	const handleDragStart = (event) => {
		setActiveId(event.active.id);
	};

	// Handle drag end
	const handleDragEnd = (event) => {
		const { active, over } = event;

		if (!over) {
			setActiveId(null);
			return;
		}

		if (active.id !== over.id) {
			// Find the source and destination teams
			let sourceTeamIndex = -1;
			let destTeamIndex = -1;
			let sourceItem = null;

			// Find the source team
			for (let i = 0; i < teamGroups.length; i++) {
				const item = teamGroups[i].picks.find((item) => item.id === active.id);
				if (item) {
					sourceTeamIndex = i;
					sourceItem = item;
					break;
				}
			}

			// If we didn't find the source, exit
			if (sourceTeamIndex === -1) {
				setActiveId(null);
				return;
			}

			// Check if we're dropping directly on a container
			const containerMatch = over.id.match(/^team-(\d+)-container$/);
			if (containerMatch) {
				destTeamIndex = parseInt(containerMatch[1]) - 1;
			} else {
				// Find which team the destination pick belongs to
				for (let i = 0; i < teamGroups.length; i++) {
					const item = teamGroups[i].picks.find((item) => item.id === over.id);
					if (item) {
						destTeamIndex = i;
						break;
					}
				}
			}

			// If we didn't find the destination, exit
			if (destTeamIndex === -1) {
				setActiveId(null);
				return;
			}

			// Update the teams based on the drag operation
			const newTeamGroups = [...teamGroups];

			// If moving between teams
			if (sourceTeamIndex !== destTeamIndex) {
				// Remove from source team
				newTeamGroups[sourceTeamIndex] = {
					...newTeamGroups[sourceTeamIndex],
					picks: newTeamGroups[sourceTeamIndex].picks.filter((item) => item.id !== active.id),
				};

				// Add to destination team with traded-pick class if moving to a non-original team
				const destTeamId = teamGroups[destTeamIndex].teamId;

				// Check if the pick is being moved to a team different from its original team
				const isTraded = sourceItem.originalTeamId && sourceItem.originalTeamId !== destTeamId;

				// Add or update the className based on whether it's traded
				const updatedSourceItem = {
					...sourceItem,
					className: isTraded ? 'traded-pick' : '',
				};

				newTeamGroups[destTeamIndex] = {
					...newTeamGroups[destTeamIndex],
					picks: [...newTeamGroups[destTeamIndex].picks, updatedSourceItem],
				};
			}
			// If reordering within the same team and not dropping on the container
			else if (!containerMatch) {
				const items = [...newTeamGroups[sourceTeamIndex].picks];
				const oldIndex = items.findIndex((item) => item.id === active.id);
				const newIndex = items.findIndex((item) => item.id === over.id);

				newTeamGroups[sourceTeamIndex] = {
					...newTeamGroups[sourceTeamIndex],
					picks: arrayMove(items, oldIndex, newIndex),
				};
			}

			setTeamGroups(newTeamGroups);
		}

		setActiveId(null);
	};

	// Handle team selection
	const handleTeamChange = (index, value) => {
		const newTeamGroups = [...teamGroups];
		newTeamGroups[index] = {
			...newTeamGroups[index],
			name: value,
		};
		setTeamGroups(newTeamGroups);
	};

	// List of all selected team names
	const selectedTeamNames = teamGroups.map((team) => team.name).filter(Boolean);

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<div className="draft-picks-container">
				{teamGroups.map((team, index) => (
					<div className={`team-picks-group ${getTeamGroupClass(teamGroups.length)}`} key={team.id}>
						<TeamSelector
							teamId={team.id}
							teamName={team.name}
							loading={loading}
							teams={teams}
							onChange={(value) => handleTeamChange(index, value)}
							selectedTeams={selectedTeamNames}
						/>
						{team.name && (
							<TeamPicksContainer
								id={`team-${team.id}-container`}
								teamLogo={team.logo || 'default-logo.png'}
								teamName={team.name || `Team ${team.id}`}
								picks={team.picks}
							>
								<SortableContext
									items={team.picks.map((pick) => pick.id)}
									strategy={verticalListSortingStrategy}
								>
									{team.picks.map((pick) => {
										// Check if this pick is from another team
										const isTraded = pick.originalTeamId && pick.originalTeamId !== team.teamId;

										// Combine existing className with traded-pick if needed
										const pickClassName = isTraded
											? `${pick.className || ''} traded-pick`.trim()
											: pick.className || '';

										return (
											<DraftPick
												key={pick.id}
												id={pick.id}
												content={pick.content}
												teamLogo={pick.originalTeamLogo}
												className={pickClassName}
											/>
										);
									})}
								</SortableContext>
							</TeamPicksContainer>
						)}
					</div>
				))}
			</div>

			<DragOverlay>
				{activeItem ? (
					<DraftPickOverlay content={activeItem.content} teamLogo={activeItem.originalTeamLogo} />
				) : null}
			</DragOverlay>
		</DndContext>
	);
};

export default TradeBuilder;
