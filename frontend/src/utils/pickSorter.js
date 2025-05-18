export const sortPicks = (picks) => {
	if (!picks) return [];
	return [...picks].sort((a, b) => {
		// Sort by year
		if (a.year !== b.year) {
			return a.year - b.year;
		}
		// Sort by round
		if (a.round !== b.round) {
			return a.round - b.round;
		}
		// Sort by pick_number (handle cases where pick_number might be null or undefined)
		// Picks without a specific number (e.g., "Future First Round Pick") should ideally come after numbered picks if year and round are the same.
		// So, null/undefined pick_number will be treated as a higher number.
		const pickA = a.pick_number == null ? Infinity : a.pick_number;
		const pickB = b.pick_number == null ? Infinity : b.pick_number;
		return pickA - pickB;
	});
};
