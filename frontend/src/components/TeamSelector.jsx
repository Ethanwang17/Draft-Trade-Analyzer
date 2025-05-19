import React from 'react';
import { Select } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const TeamSelector = ({
	teamId,
	teamName,
	loading,
	teams,
	onChange,
	selectedTeams,
	onRemoveTeam,
	totalTeams,
}) => {
	return (
		<div className="team-select">
			<div className="team-select-header">
				<label htmlFor={`team-${teamId}`}>Team {teamId}</label>
				{onRemoveTeam && totalTeams > 2 && (
					<button
						className="remove-team-button"
						onClick={() => onRemoveTeam(teamId)}
						title="Remove team"
					>
						<CloseOutlined />
					</button>
				)}
			</div>
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
				options={teams
					.filter((dbTeam) => !selectedTeams.includes(dbTeam.name) || dbTeam.name === teamName)
					.map((dbTeam) => ({
						value: dbTeam.name,
						label: dbTeam.name,
					}))}
			/>
		</div>
	);
};

export default TeamSelector;
