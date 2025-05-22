import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Restores the Home page state when navigating back from the Analyze page.
 *
 * The Analyze page can push the following state via React-Router:
 *   {
 *     preserveTradeState: true,
 *     teamGroups: [...],
 *     selectedValuation: number,
 *   }
 *
 * This hook handles rebuilding the `originalPicksRef`, re-applying the valuation model and
 * recalculating the "trades made" indicator so that all functionality continues to work.
 */
export const useRestoreTradeState = ({
	handleValuationChange,
	originalPicksRef,
	checkForTradesMadeAndUpdateState,
	checkForTradesMade,
}) => {
	const location = useLocation();

	useEffect(() => {
		if (location.state?.preserveTradeState) {
			// Restore the valuation model that was active on the Analyze page
			if (location.state.selectedValuation) {
				handleValuationChange(location.state.selectedValuation);
			}

			// Rebuild original picks cache & determine if trades exist
			if (location.state.teamGroups) {
				const teams = location.state.teamGroups.filter((team) => team.teamId);

				// Populate originalPicksRef so the reset hook can function correctly
				teams.forEach((team) => {
					if (!team.teamId) return;

					const originalPicks = [];
					teams.forEach((sourceTeam) => {
						sourceTeam.picks.forEach((pick) => {
							if (pick.originalTeamId === team.teamId) {
								originalPicks.push({ ...pick });
							}
						});
					});

					if (originalPicks.length > 0) {
						originalPicksRef.current[team.teamId] = originalPicks;
					}
				});

				// Update trade-made indicator based on restored state
				checkForTradesMadeAndUpdateState(location.state.teamGroups, checkForTradesMade);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- we intentionally watch the whole location.state object
	}, [location.state]);
};
