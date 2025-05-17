import React, { useState, useMemo, useEffect } from 'react';
import { Select } from 'antd';
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragOverlay,
	useDroppable,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Draft Pick component
const DraftPick = ({ id, content, teamId }) => {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div ref={setNodeRef} style={style} className="draft-pick" {...attributes} {...listeners}>
			{content}
		</div>
	);
};

// Draft Pick Overlay
const DraftPickOverlay = ({ content }) => {
	return <div className="draft-pick draft-pick-overlay">{content}</div>;
};

// Droppable Team Container
const TeamPicksContainer = ({ id, teamLogo, teamName, picks, children }) => {
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

function HomePage() {
	const [teamOne, setTeamOne] = useState('');
	const [teamTwo, setTeamTwo] = useState('');
	const [teamOneLogo, setTeamOneLogo] = useState('');
	const [teamTwoLogo, setTeamTwoLogo] = useState('');
	const [activeId, setActiveId] = useState(null);
	const [teams, setTeams] = useState([]);
	const [loading, setLoading] = useState(true);

	// Fetch teams from the database
	useEffect(() => {
		const fetchTeams = async () => {
			try {
				const response = await fetch('/api/teams');
				if (!response.ok) {
					throw new Error('Failed to fetch teams');
				}
				const teamsData = await response.json();
				setTeams(teamsData);
			} catch (error) {
				console.error('Error fetching teams:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchTeams();
	}, []);

	useEffect(() => {
		const selectedTeamOne = teams.find((team) => team.name === teamOne);
		const selectedTeamTwo = teams.find((team) => team.name === teamTwo);
		setTeamOneLogo(selectedTeamOne ? selectedTeamOne.logo : '');
		setTeamTwoLogo(selectedTeamTwo ? selectedTeamTwo.logo : '');
	}, [teamOne, teamTwo, teams]);

	// Team picks data
	const [teamOnePicks, setTeamOnePicks] = useState([
		{ id: 'pick-1', content: '2025 First Round Pick' },
		{ id: 'pick-2', content: '2026 First Round Pick' },
		{ id: 'pick-3', content: '2026 Second Round Pick' },
	]);

	const [teamTwoPicks, setTeamTwoPicks] = useState([
		{ id: 'pick-4', content: '2025 First Round Pick' },
		{ id: 'pick-5', content: '2026 First Round Pick' },
		{ id: 'pick-6', content: '2027 Second Round Pick' },
	]);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Find the active item for the drag overlay
	const activeItem = useMemo(() => {
		if (!activeId) return null;

		const teamOneItem = teamOnePicks.find((item) => item.id === activeId);
		const teamTwoItem = teamTwoPicks.find((item) => item.id === activeId);

		return teamOneItem || teamTwoItem;
	}, [activeId, teamOnePicks, teamTwoPicks]);

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
			// Check if we're dropping directly on a container
			const isDropOnTeamOneContainer = over.id === 'team-one-container';
			const isDropOnTeamTwoContainer = over.id === 'team-two-container';

			// Get source and destination teams
			const isFromTeamOne = teamOnePicks.some((item) => item.id === active.id);
			const isToTeamOne =
				isDropOnTeamOneContainer || teamOnePicks.some((item) => item.id === over.id);
			const isToTeamTwo =
				isDropOnTeamTwoContainer || teamTwoPicks.some((item) => item.id === over.id);

			// If moving between teams
			if ((isFromTeamOne && isToTeamTwo) || (!isFromTeamOne && isToTeamOne)) {
				const sourceTeam = isFromTeamOne ? teamOnePicks : teamTwoPicks;
				const destTeam = isFromTeamOne ? teamTwoPicks : teamOnePicks;

				const itemToMove = sourceTeam.find((item) => item.id === active.id);

				if (itemToMove) {
					// Remove from source team
					const newSourceTeam = sourceTeam.filter((item) => item.id !== active.id);

					// Add to destination team
					const newDestTeam = [...destTeam, itemToMove];

					// Update state
					if (isFromTeamOne) {
						setTeamOnePicks(newSourceTeam);
						setTeamTwoPicks(newDestTeam);
					} else {
						setTeamTwoPicks(newSourceTeam);
						setTeamOnePicks(newDestTeam);
					}
				}
			}
			// If reordering within the same team
			else if (!isDropOnTeamOneContainer && !isDropOnTeamTwoContainer) {
				const isTeamOne = teamOnePicks.some((item) => item.id === active.id);
				const items = isTeamOne ? [...teamOnePicks] : [...teamTwoPicks];

				const oldIndex = items.findIndex((item) => item.id === active.id);
				const newIndex = items.findIndex((item) => item.id === over.id);

				const newItems = arrayMove(items, oldIndex, newIndex);

				if (isTeamOne) {
					setTeamOnePicks(newItems);
				} else {
					setTeamTwoPicks(newItems);
				}
			}
		}

		setActiveId(null);
	};

	return (
		<div className="home-page">
			<div className="header-container">
				<h1 className="main-title">Explore NBA Draft Pick Trades</h1>
			</div>

			<div className="trade-builder">
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					<div className="draft-picks-container">
						<div className="team-picks-group">
							<div className="team-select">
								<label htmlFor="team-one">Team 1</label>
								<Select
									id="team-one"
									value={teamOne}
									onChange={(value) => setTeamOne(value)}
									className="team-dropdown"
									disabled={loading}
									showSearch
									placeholder="Select Team"
									optionFilterProp="children"
									filterOption={(input, option) =>
										(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
									}
									options={teams.map((team) => ({
										value: team.name,
										label: team.name,
									}))}
								/>
							</div>
							{teamOne && (
								<TeamPicksContainer
									id="team-one-container"
									teamLogo={teamOneLogo || 'default-logo.png'}
									teamName={teamOne || 'Team 1'}
									picks={teamOnePicks}
								>
									<SortableContext
										items={teamOnePicks.map((pick) => pick.id)}
										strategy={verticalListSortingStrategy}
									>
										{teamOnePicks.map((pick) => (
											<DraftPick
												key={pick.id}
												id={pick.id}
												content={pick.content}
												teamId="team-one"
											/>
										))}
									</SortableContext>
								</TeamPicksContainer>
							)}
						</div>

						<div className="team-picks-group">
							<div className="team-select">
								<label htmlFor="team-two">Team 2</label>
								<Select
									id="team-two"
									value={teamTwo}
									onChange={(value) => setTeamTwo(value)}
									className="team-dropdown"
									disabled={loading}
									showSearch
									placeholder="Select Team"
									optionFilterProp="children"
									filterOption={(input, option) =>
										(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
									}
									options={teams.map((team) => ({
										value: team.name,
										label: team.name,
									}))}
								/>
							</div>
							{teamTwo && (
								<TeamPicksContainer
									id="team-two-container"
									teamLogo={teamTwoLogo || 'default-logo.png'}
									teamName={teamTwo || 'Team 2'}
									picks={teamTwoPicks}
								>
									<SortableContext
										items={teamTwoPicks.map((pick) => pick.id)}
										strategy={verticalListSortingStrategy}
									>
										{teamTwoPicks.map((pick) => (
											<DraftPick
												key={pick.id}
												id={pick.id}
												content={pick.content}
												teamId="team-two"
											/>
										))}
									</SortableContext>
								</TeamPicksContainer>
							)}
						</div>
					</div>

					<DragOverlay>
						{activeItem ? <DraftPickOverlay content={activeItem.content} /> : null}
					</DragOverlay>
				</DndContext>

				<div className="action-container">
					<button className="analyze-button">Analyze Trade</button>
				</div>
			</div>
		</div>
	);
}

export default HomePage;
