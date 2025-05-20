import React, { useState } from 'react';
import { Row, Col, Select, Button, Tooltip } from 'antd';
import { FilterOutlined, ClearOutlined } from '@ant-design/icons';
import './FilterBar.css';

const { Option } = Select;

const FilterBar = ({ teams, onApplyFilters, onClearFilters }) => {
	const [selectedTeams, setSelectedTeams] = useState([]);
	const [sortOption, setSortOption] = useState('date_newest');

	const handleApplyFilters = () => {
		onApplyFilters({
			teams: selectedTeams,
			sortOption,
		});
	};

	const handleClearFilters = () => {
		setSelectedTeams([]);
		setSortOption('date_newest');
		onClearFilters();
	};

	return (
		<div className="filter-bar">
			<Row gutter={[16, 16]} align="middle">
				<Col xs={24} sm={24} md={12} lg={12} xl={12}>
					<div className="filter-item">
						<label htmlFor="teams-filter">Team</label>
						<Select
							id="teams-filter"
							mode="multiple"
							placeholder="Select teams"
							value={selectedTeams}
							onChange={setSelectedTeams}
							style={{ width: '100%' }}
							allowClear
						>
							{teams.map((team) => (
								<Option key={team.id} value={team.id}>
									{team.name}
								</Option>
							))}
						</Select>
					</div>
				</Col>

				<Col xs={24} sm={24} md={12} lg={12} xl={12}>
					<div className="filter-item">
						<label htmlFor="sort-option">Sort By</label>
						<Select
							id="sort-option"
							value={sortOption}
							onChange={setSortOption}
							style={{ width: '100%' }}
						>
							<Option value="date_newest">Date (Newest First)</Option>
							<Option value="date_oldest">Date (Oldest First)</Option>
						</Select>
					</div>
				</Col>

				<Col xs={24} sm={24} md={24} lg={24} xl={24} className="filter-actions">
					<Tooltip title="Apply filters">
						<Button type="primary" icon={<FilterOutlined />} onClick={handleApplyFilters}>
							Apply
						</Button>
					</Tooltip>
					<Tooltip title="Clear filters">
						<Button icon={<ClearOutlined />} onClick={handleClearFilters}>
							Clear
						</Button>
					</Tooltip>
				</Col>
			</Row>
		</div>
	);
};

export default FilterBar;
