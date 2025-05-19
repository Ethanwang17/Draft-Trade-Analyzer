import { useState, useEffect } from 'react';

/**
 * Hook for fetching and managing pick values
 * @param {Object} tradeData - Trade data with teamGroups
 * @param {Number} selectedValuation - ID of the selected valuation model
 * @returns {Object} Pick values and loading state
 */
export const usePickValues = (tradeData, selectedValuation) => {
	const [pickValues, setPickValues] = useState({});
	const [valuesLoading, setValuesLoading] = useState(false);

	// Fetch pick values for all picks
	useEffect(() => {
		if (!tradeData || !tradeData.teamGroups) return;

		const fetchPickValues = async () => {
			setValuesLoading(true);
			const newPickValues = {};

			// Collect all unique pick numbers from all teams
			const pickNumbers = new Set();

			tradeData.teamGroups.forEach((team) => {
				if (!team.picks) return;

				team.picks.forEach((pick) => {
					if (pick.pick_number) {
						pickNumbers.add(pick.pick_number);
					}
				});
			});

			// Fetch values for all picks
			for (const pickNumber of pickNumbers) {
				try {
					const apiUrl = `/api/pick-value/${pickNumber}/${selectedValuation}`;
					const response = await fetch(apiUrl);

					if (response.ok) {
						const data = await response.json();
						newPickValues[pickNumber] = parseFloat(data.value);
					}
				} catch (error) {
					console.error(`Error fetching value for pick ${pickNumber}:`, error);
				}
			}

			setPickValues(newPickValues);
			setValuesLoading(false);
		};

		fetchPickValues();
	}, [tradeData, selectedValuation]);

	return { pickValues, valuesLoading };
};
