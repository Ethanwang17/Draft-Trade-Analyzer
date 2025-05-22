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
			const fetchPromises = [];

			// Collect all unique numbered picks
			const numberedPicks = new Set();
			// Collect future picks (year/round combinations without specific pick numbers)
			const futurePicks = [];

			tradeData.teamGroups.forEach((team) => {
				if (!team.picks) return;

				team.picks.forEach((pick) => {
					if (pick.pick_number) {
						// This is a numbered pick with a known position
						numberedPicks.add(pick.pick_number);
					} else if (pick.year && pick.round) {
						// This is a future pick without a specific pick number
						futurePicks.push({
							id: pick.id,
							year: pick.year,
							round: pick.round,
						});
					}
				});
			});

			// Fetch values for all numbered picks
			for (const pickNumber of numberedPicks) {
				const apiUrl = `/api/pick-value/${pickNumber}/${selectedValuation}`;
				const promise = fetch(apiUrl)
					.then((response) => {
						if (!response.ok) {
							throw new Error('Pick value not found');
						}
						return response.json();
					})
					.then((data) => {
						newPickValues[pickNumber] = parseFloat(data.value);
					})
					.catch((error) => {
						console.error(`Error fetching value for pick ${pickNumber}:`, error);
					});

				fetchPromises.push(promise);
			}

			// Fetch values for future picks based on round averages
			for (const futurePick of futurePicks) {
				const apiUrl = `/api/future-pick-value/${futurePick.year}/${futurePick.round}/${selectedValuation}`;
				const promise = fetch(apiUrl)
					.then((response) => {
						if (!response.ok) {
							throw new Error('Future pick value not found');
						}
						return response.json();
					})
					.then((data) => {
						// Store using a special format for future picks: "future_year_round"
						const key = `future_${futurePick.year}_${futurePick.round}`;
						newPickValues[key] = parseFloat(data.value);

						// Also associate the value with the pick's unique id
						newPickValues[futurePick.id] = parseFloat(data.value);
					})
					.catch((error) => {
						console.error(
							`Error fetching value for future pick [Year: ${futurePick.year}, Round: ${futurePick.round}]:`,
							error
						);
					});

				fetchPromises.push(promise);
			}

			// Wait for all fetch operations to complete
			await Promise.all(fetchPromises);

			setPickValues(newPickValues);
			setValuesLoading(false);
		};

		fetchPickValues();
	}, [tradeData, selectedValuation]);

	return { pickValues, valuesLoading };
};
