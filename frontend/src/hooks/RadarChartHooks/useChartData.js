import { useMemo } from 'react';

/**
 * Hook for preparing the radar chart data based on teams and selected axes
 * @param {Array} teams - Array of team objects participating in the trade
 * @param {Function} calculateTeamValues - Function to calculate team values
 * @param {Array} selectedAxes - Array of currently selected axes to display
 * @returns {object} The chart data and related values
 */
export function useChartData(teams, calculateTeamValues, selectedAxes) {
	// Color palette for teams
	const colors = ['#0074D9', '#FF4136', '#2ECC40', '#FF851B'];

	// Prepare radar chart data structure (memoized for perf)
	const baseMetrics = useMemo(() => {
		if (!teams || teams.length === 0) {
			return [];
		}

		const metricsArray = [
			{ metric: 'Total Incoming Value' },
			{ metric: 'Total Outgoing Value' },
			{ metric: '# of Incoming Picks' },
			{ metric: '# of Outgoing Picks' },
			{ metric: 'Net Pick Value' },
		];

		teams.forEach((team) => {
			const values = calculateTeamValues(team);

			metricsArray[0][team.name] = Math.round(values.incomingValue);
			metricsArray[1][team.name] = Math.round(values.outgoingValue);
			metricsArray[2][team.name] = values.incomingPicks.length;
			metricsArray[3][team.name] = values.outgoingPicks.length;
			metricsArray[4][team.name] = Math.round(values.netValue);
		});

		return metricsArray;
	}, [teams, calculateTeamValues]);

	// Filter metrics based on user selection
	const chartData = useMemo(
		() => baseMetrics.filter((metricObj) => selectedAxes.includes(metricObj.metric)),
		[baseMetrics, selectedAxes]
	);

	return {
		colors,
		chartData,
		hasEnoughAxes: selectedAxes.length >= 3,
		hasTeams: teams && teams.length > 0,
	};
}
