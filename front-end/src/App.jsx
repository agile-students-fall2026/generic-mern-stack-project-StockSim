import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import AppLayout from './components/layout/AppLayout.jsx'
import AccountPage from './pages/account/AccountPage.jsx'
import AuthPage from './pages/auth/AuthPage.jsx'
import LeaderboardPage from './pages/leaderboard/LeaderboardPage.jsx'
import LearnPage from './pages/learn/LearnPage.jsx'
import MarketPage from './pages/market/MarketPage.jsx'
import StockDetailsPage from './pages/market/StockDetailsPage.jsx'
import WatchlistPage from './pages/market/WatchlistPage.jsx'
import TradePage from './pages/market/TradePage.jsx'
import PracticeProvider from './features/market/PracticeProvider.jsx'
import NotFoundPage from './pages/not-found/NotFoundPage.jsx'
import PortfolioPage from './pages/portfolio/PortfolioPage.jsx'
import WelcomePage from './pages/welcome/WelcomePage.jsx'

function App() {
  const { pathname } = useLocation()

  useEffect(() => {
    const heading = document.querySelector('main h1')
    document.title = heading ? `${heading.textContent} | StockSim` : 'StockSim'
    heading?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <PracticeProvider><Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/create-account" element={<AuthPage key="create-account" creatingAccount />} />
      <Route path="/login" element={<AuthPage key="login" />} />
      <Route element={<AppLayout />}>
        <Route path="portfolio" element={<PortfolioPage />} />
        <Route path="market" element={<MarketPage />} />
        <Route path="market/:symbol" element={<StockDetailsPage />} />
        <Route path="market/watchlist" element={<WatchlistPage />} />
        <Route path="market/:symbol/buy" element={<TradePage side="buy" />} />
        <Route path="market/:symbol/sell" element={<TradePage side="sell" />} />
        <Route path="learn" element={<LearnPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="account" element={<AccountPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes></PracticeProvider>
  )
}

export default App
