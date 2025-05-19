import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import { useState } from 'react';
import 'antd/dist/reset.css';
import './App.css';
import NavBar from './components/NavBar/NavBar';
import HomePage from './pages/HomePage';
import SavedTrades from './pages/SavedTrades';
import AnalyzeTrade from './pages/AnalyzeTrade';

const { Content } = Layout;

function App() {
	const [collapsed, setCollapsed] = useState(false);

	const navItems = [
		{
			label: 'Home',
			href: '/home',
		},
		{
			label: 'Saved Trades',
			href: '/saved',
		},
	];

	return (
		<Router basename="/Draft-Trade-Analyzer">
			<Layout style={{ minHeight: '100vh' }}>
				<NavBar items={navItems} collapsed={collapsed} setCollapsed={setCollapsed} />
				<Layout className="site-layout" style={{ marginLeft: collapsed ? 80 : 180 }}>
					<Content className="content">
						<Routes>
							<Route path="/home" element={<HomePage />} />
							<Route path="/saved" element={<SavedTrades />} />
							<Route path="/analyze" element={<AnalyzeTrade />} />
							<Route path="/" element={<Navigate to="/home" />} />
						</Routes>
					</Content>
				</Layout>
			</Layout>
		</Router>
	);
}

export default App;
