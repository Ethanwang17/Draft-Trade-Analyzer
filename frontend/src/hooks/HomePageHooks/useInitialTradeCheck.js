import { useEffect } from 'react';

/**
 * Hook to initialize the 'hasTradesMade' flag based on current team groups
 * Runs once after mount (and whenever the `teamGroups` array changes) to set the
 * `hasTradesMade` flag. Extracted out of HomePage to keep the component concise.
 */
export const useInitialTradeCheck = ({ teamGroups, checkForTradesMade, setHasTradesMade }) => {
	useEffect(() => {
		// Recalculate trade status when team groups change
		if (checkForTradesMade && teamGroups.length > 0) {
			const hasTrades = checkForTradesMade(teamGroups);
			setHasTradesMade(hasTrades);
		}
	}, [checkForTradesMade, teamGroups, setHasTradesMade]);
};
