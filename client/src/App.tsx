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
          <Routes>
            <Route path='/dao/create' element={<CreateDAOPage />} />
            <Route path='/dao/:id' element={<Layout />}>
              <Route path='' element={<HomePage />} />
              <Route path='update' element={<UpdateDAOPage />} />
              <Route path='reward' element={<RewardPage />} />
              <Route path='governance' element={<GovernanceVotingPage />} />
              <Route path='reward/create' element={<RewardCreatePage />} />
              <Route
                path='reward/send/:mosaicId'
                element={<RewardSendPage />}
              />
              <Route path='point' element={<PointPage />} />
              <Route path='point/create' element={<PointCreatePage />} />
              <Route path='point/send/:mosaicId' element={<PointSendPage />} />
              <Route
                path='point/revoke/:mosaicId'
                element={<PointRevokePage />}
              />
            <Route path='limited' element={<LimitedMemberPage />} />
            </Route>
          </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
