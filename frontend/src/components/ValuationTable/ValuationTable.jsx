import React from 'react';
import { Card, Table } from 'antd';
import './ValuationTable.css';

function ValuationTable({ pickValues, columns }) {
	return (
		<Card title="Pick Values Table" className="table-card">
			<Table columns={columns} dataSource={pickValues} pagination={false} size="middle" />
		</Card>
	);
}

export default ValuationTable;
