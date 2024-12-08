import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import { ThemeProvider } from "./components/ThemeContext"

import Layout from "./components/Layout"
import { HomePage } from "./pages/Home"
import { GovernanceVotingPage } from "./pages/GovernanceVoting"
import { LimitedMemberPage } from "./pages/Limited"
import { DaoPage } from "./pages/DAO"
import { CreateDAOPage } from "./pages/DAO/Create"
import { UpdateDAOPage } from "./pages/DAO/Update"
import { RewardPage } from "./pages/Reward"
import { PointPage } from "./pages/Point"
import { PointSendPage } from "./pages/Point/Send"
import { PointRevokePage } from "./pages/Point/Revoke"
import { RewardSendPage } from "./pages/Reward/Send"
import { PointCreatePage } from "./pages/Point/Create"
import { RewardCreatePage } from "./pages/Reward/Create"

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/governance' element={<GovernanceVotingPage />} />
            <Route path='/limited' element={<LimitedMemberPage />} />
            <Route path='/dao/:id' element={<DaoPage />} />
            <Route path='/dao/create' element={<CreateDAOPage />} />
            <Route path='/dao/:id/update' element={<UpdateDAOPage />} />
            <Route path='/dao/:id/reward' element={<RewardPage />} />
            <Route
              path='/dao/:id/reward/create'
              element={<RewardCreatePage />}
            />
            <Route
              path='/dao/:id/reward/send/:mosaicId'
              element={<RewardSendPage />}
            />
            <Route path='/dao/:id/point/create' element={<PointCreatePage />} />
            <Route path='/dao/:id/point' element={<PointPage />} />
            <Route
              path='/dao/:id/point/send/:mosaicId'
              element={<PointSendPage />}
            />
            <Route
              path='/dao/:id/point/revoke/:mosaicId'
              element={<PointRevokePage />}
            />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  )
}

export default App
