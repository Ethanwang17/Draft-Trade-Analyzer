import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import { useState, useEffect } from 'react';
import 'antd/dist/reset.css';
import './App.css';
import NavBar from './components/Layout/NavBar/NavBar';
import HomePage from './pages/HomePage';
import SavedTradesPage from './pages/SavedTradesPage';
import AnalyzeTrade from './pages/AnalyzeTrade';
import ValuationModelPage from './pages/ValuationModelPage';

const { Content } = Layout;

function App() {
	const [collapsed, setCollapsed] = useState(false);
	const [userToggled, setUserToggled] = useState(false);

	useEffect(() => {
		const handleResize = () => {
			if (!userToggled) {
				if (window.innerWidth < 769) {
					setCollapsed(true);
				} else {
					setCollapsed(false);
				}
			}
		};

		window.addEventListener('resize', handleResize);
		handleResize(); // Initial check

		return () => window.removeEventListener('resize', handleResize);
	}, [userToggled]);

	const handleToggleCollapse = (value) => {
		setUserToggled(true);
		setCollapsed(value);
	};

	const navItems = [
		{
			label: 'Home',
			href: '/home',
		},
		{
			label: 'Saved Trades',
			href: '/saved',
		},
		{
			label: 'Valuations',
			href: '/valuations',
		},
	];

	return (
		<ConfigProvider
			theme={{
				token: {
					borderRadius: 50,
					colorPrimary: '#5b21b6',

				},
			}}
		>
			<Router>
				<Layout style={{ minHeight: '100vh' }}>
					<NavBar items={navItems} collapsed={collapsed} setCollapsed={handleToggleCollapse} />
					<Layout className="site-layout" style={{ marginLeft: collapsed ? 80 : 180 }}>
						<Content className="content">
							<Routes>
								<Route path="/home" element={<HomePage />} />
								<Route path="/saved" element={<SavedTradesPage />} />
								<Route path="/analyze" element={<AnalyzeTrade />} />
								<Route path="/valuations" element={<ValuationModelPage />} />
								<Route path="/" element={<Navigate to="/home" />} />
							</Routes>
						</Content>
					</Layout>
				</Layout>
			</Router>
		</ConfigProvider>
	);
}

export default App;
