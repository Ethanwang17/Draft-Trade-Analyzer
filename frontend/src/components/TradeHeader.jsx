import React from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const TradeHeader = ({ onAddTeam, disableAddTeam }) => {
	return (
		<div className="header-container">
			<h1 className="main-title">Explore NBA Draft Pick Trades</h1>
			<Button
				type="primary"
				icon={<PlusOutlined />}
				onClick={onAddTeam}
				disabled={disableAddTeam}
				className="add-team-button"
			>
				Add Team
			</Button>
		</div>
	);
};

export default TradeHeader;
