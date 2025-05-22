import React from 'react';
// Table listing each draft pick's value and normalized score
import { Card, Table } from 'antd';
// Ant Design table component with fixed columns and no pagination
import './ValuationTable.css';

function ValuationTable({ pickValues, columns }) {
	return (
		<Card title="Pick Values Table" className="table-card">
			<Table columns={columns} dataSource={pickValues} pagination={false} size="middle" />
		</Card>
	);
}

export default ValuationTable;
