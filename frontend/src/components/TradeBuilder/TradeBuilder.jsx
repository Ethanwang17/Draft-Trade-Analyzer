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

import { DraftPick, DraftPickOverlay, TeamPicksContainer } from '../TeamCard/TeamCard';
import TeamSelector from '../Selector/TeamSelector/TeamSelector';
import './TradeBuilder.css';
import { sortPicks } from '../../utils/pickSorter';

const TradeBuilder = ({
	teams,
	loading,
	teamGroups,
	setTeamGroups,
	getTeamGroupClass,
	isResetting,
	onRemoveTeam,
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

	// Hook to get active dragged item details from teamGroups
	const activeItem = useMemo(() => {
		if (!activeId) return null;

		for (const group of teamGroups) {
			const item = group.picks.find((item) => item.id === activeId);
			if (item) return item;
		}

		return null;
	}, [activeId, teamGroups]);

	// Builds a map of incoming and outgoing picks per team for trade summary
	const tradeData = useMemo(() => {
		// Create a map to store each team's outgoing and incoming picks
		const teamTradeData = {};

		// Initialize the trade data structure for each team
		teamGroups.forEach((team) => {
			if (team.teamId) {
				teamTradeData[team.teamId] = {
					outgoing: [],
					incoming: [],
				};
			}
		});

		// Find all picks that are not with their original team
		teamGroups.forEach((team) => {
			if (!team.teamId) return;

			// Check each pick
			team.picks.forEach((pick) => {
				// If this pick belongs to another team originally
				if (pick.originalTeamId && pick.originalTeamId !== team.teamId) {
					// Add to current team's incoming
					if (teamTradeData[team.teamId]) {
						teamTradeData[team.teamId].incoming.push({
							...pick,
							fromTeam: pick.originalTeamName,
						});
					}

					// Add to original team's outgoing
					if (teamTradeData[pick.originalTeamId]) {
						teamTradeData[pick.originalTeamId].outgoing.push({
							...pick,
							toTeam: team.name,
						});
					}
				}
			});
		});

		return teamTradeData;
	}, [teamGroups]);

	// Determine selected valuation model from first available pick
	const selectedValuation = useMemo(() => {
		for (const team of teamGroups) {
			if (team.picks && team.picks.length > 0 && team.picks[0].valuation) {
				return team.picks[0].valuation;
			}
		}
		return 1; // Default to 1 if no picks found
	}, [teamGroups]);

	// Handle start of a drag event
	const handleDragStart = (event) => {
		setActiveId(event.active.id);
	};

	// Handle end of a drag event, updating pick locations or order
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
					picks: sortPicks([...newTeamGroups[destTeamIndex].picks, updatedSourceItem]),
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
		const previousTeam = newTeamGroups[index];
		const previousTeamId = previousTeam.teamId;

		// Store the ID before updating
		newTeamGroups[index] = {
			...newTeamGroups[index],
			name: value,
		};

		// If this was a previously selected team with a teamId, we need to handle its picks
		if (previousTeamId) {
			// 1. Find picks that belonged to the team being changed but are now with other teams
			// and remove them from those teams
			for (let i = 0; i < newTeamGroups.length; i++) {
				// Skip the team being changed
				if (i === index) continue;

				const group = newTeamGroups[i];

				// Check for picks that belonged to the previous team
				const filteredPicks = group.picks.filter((pick) => pick.originalTeamId !== previousTeamId);

				// Update picks if any were removed
				if (filteredPicks.length !== group.picks.length) {
					newTeamGroups[i] = {
						...group,
						picks: filteredPicks,
					};
				}
			}

			// 2. Return any picks from other teams that this team currently has
			const picksToReturn = previousTeam.picks.filter(
				(pick) => pick.originalTeamId !== previousTeamId
			);

			picksToReturn.forEach((pick) => {
				const originalTeamIndex = newTeamGroups.findIndex(
					(group) => group.teamId === pick.originalTeamId
				);

				if (originalTeamIndex !== -1) {
					// Reset the className (remove traded-pick class) before returning to original team
					const resetPick = {
						...pick,
						className: '', // Remove traded-pick class
					};

					// Add the pick back to its original team
					newTeamGroups[originalTeamIndex] = {
						...newTeamGroups[originalTeamIndex],
						picks: sortPicks([...newTeamGroups[originalTeamIndex].picks, resetPick]),
					};
				}
			});

			// 3. Clear the picks for the team that changed
			newTeamGroups[index] = {
				...newTeamGroups[index],
				picks: [],
			};
		}

		setTeamGroups(newTeamGroups);
	};

	// Reset a specific pick to its original team and update class styling
	const resetPickToOriginalTeam = (pickId) => {
		// Find which team currently has this pick
		let currentTeamIndex = -1;
		let pickToReset = null;

		for (let i = 0; i < teamGroups.length; i++) {
			const pick = teamGroups[i].picks.find((item) => item.id === pickId);
			if (pick) {
				currentTeamIndex = i;
				pickToReset = pick;
				break;
			}
		}

		if (!pickToReset || currentTeamIndex === -1) return;

		// Find the original team index
		const originalTeamIndex = teamGroups.findIndex(
			(team) => team.teamId === pickToReset.originalTeamId
		);

		if (originalTeamIndex === -1) return;

		// Create new team groups array
		const newTeamGroups = [...teamGroups];

		// Remove the pick from its current team
		newTeamGroups[currentTeamIndex] = {
			...newTeamGroups[currentTeamIndex],
			picks: newTeamGroups[currentTeamIndex].picks.filter((p) => p.id !== pickId),
		};

		// Reset the className (remove traded-pick class) before returning to original team
		const resetPick = {
			...pickToReset,
			className: '', // Remove traded-pick class
		};

		// Add the pick back to its original team
		newTeamGroups[originalTeamIndex] = {
			...newTeamGroups[originalTeamIndex],
			picks: sortPicks([...newTeamGroups[originalTeamIndex].picks, resetPick]),
		};

		// Apply a brief animation class to highlight the returned pick
		resetPick.className = 'pick-resetting';

		// Update the team groups - let the parent component sort the picks
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
							onRemoveTeam={onRemoveTeam}
							totalTeams={teamGroups.length}
						/>
						{team.name && (
							<TeamPicksContainer
								id={`team-${team.id}-container`}
								teamLogo={team.logo || 'default-logo.png'}
								teamName={team.name || `Team ${team.id}`}
								picks={team.picks}
								teamId={team.teamId}
								tradeData={team.teamId ? tradeData[team.teamId] : null}
								onResetPick={resetPickToOriginalTeam}
								selectedValuation={selectedValuation}
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
