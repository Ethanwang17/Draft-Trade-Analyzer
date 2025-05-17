import React, { useState, useEffect } from 'react';
import TradeBuilder from '../components/TradeBuilder';
import TradeHeader from '../components/TradeHeader';
import TradeActions from '../components/TradeActions';
import { getTeamGroupClass, getTradeBuilderStyle } from '../utils/tradeUtils';

function HomePage() {
	const [teams, setTeams] = useState([]);
	const [loading, setLoading] = useState(true);

	// Replace individual team states with an array of teams
	const [teamGroups, setTeamGroups] = useState([
		{
			id: 1,
			name: '',
			logo: '',
			picks: [
				{ id: 'pick-1', content: '2025 First Round Pick' },
				{ id: 'pick-2', content: '2026 First Round Pick' },
				{ id: 'pick-3', content: '2026 Second Round Pick' },
			],
		},
		{
			id: 2,
			name: '',
			logo: '',
			picks: [
				{ id: 'pick-4', content: '2025 First Round Pick' },
				{ id: 'pick-5', content: '2026 First Round Pick' },
				{ id: 'pick-6', content: '2027 Second Round Pick' },
			],
		},
	]);

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

	// Update team logos when team names change
	useEffect(() => {
		const updatedTeamGroups = teamGroups.map((group) => {
			const selectedTeam = teams.find((team) => team.name === group.name);
			return {
				...group,
				logo: selectedTeam ? selectedTeam.logo : '',
			};
		});
		setTeamGroups(updatedTeamGroups);
	}, [teamGroups.map((t) => t.name).join(','), teams]);

	// Add a new team (maximum 6 teams)
	const addTeam = () => {
		if (teamGroups.length >= 6) return;

		const newId = teamGroups.length + 1;
		setTeamGroups([
			...teamGroups,
			{
				id: newId,
				name: '',
				logo: '',
				picks: [
					{ id: `pick-${newId * 3 + 1}`, content: '2025 First Round Pick' },
					{ id: `pick-${newId * 3 + 2}`, content: '2026 First Round Pick' },
					{ id: `pick-${newId * 3 + 3}`, content: '2026 Second Round Pick' },
				],
			},
		]);
	};

	// Handle analyzing the trade
	const handleAnalyzeTrade = () => {
		console.log('Analyzing trade for teams:', teamGroups);
		// Additional logic for trade analysis would go here
	};

	return (
		<div className="home-page">
			<TradeHeader onAddTeam={addTeam} disableAddTeam={teamGroups.length >= 6} />

			<div className="trade-builder" style={getTradeBuilderStyle(teamGroups.length)}>
				<TradeBuilder
					teams={teams}
					loading={loading}
					teamGroups={teamGroups}
					setTeamGroups={setTeamGroups}
					getTeamGroupClass={getTeamGroupClass}
				/>

				<TradeActions onAnalyze={handleAnalyzeTrade} />
			</div>
		</div>
	);
}

export default HomePage;
