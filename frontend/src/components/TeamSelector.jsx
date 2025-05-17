import React from 'react';
import { Select } from 'antd';

const TeamSelector = ({ teamId, teamName, loading, teams, onChange }) => {
	return (
		<div className="team-select">
			<label htmlFor={`team-${teamId}`}>Team {teamId}</label>
			<Select
				id={`team-${teamId}`}
				value={teamName}
				onChange={onChange}
				className="team-dropdown"
				disabled={loading}
				showSearch
				placeholder="Select Team"
				optionFilterProp="children"
				filterOption={(input, option) =>
					(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
				}
				options={teams.map((dbTeam) => ({
					value: dbTeam.name,
					label: dbTeam.name,
				}))}
			/>
		</div>
	);
};

export default TeamSelector;
