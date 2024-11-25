import { BrowserRouter as Router, Route, Routes } from "react-router-dom"

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
import { RewardRevokePage } from "./pages/Reward/Revoke"
import { RewardSendPage } from "./pages/Reward/Send"

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/governance' element={<GovernanceVotingPage />} />
          <Route path='/limited' element={<LimitedMemberPage />} />
          <Route path='/dao' element={<DaoPage />} />
          <Route path='/dao/create' element={<CreateDAOPage />} />
          <Route path='/dao/:id/update' element={<UpdateDAOPage />} />
          <Route path='/reward' element={<RewardPage />} />
          {/* <Route path='/dao/:id/reward' element={<RewardPage />} /> */}
          <Route path='/reward/send' element={<RewardSendPage />} />
          <Route path='/reward/revoke' element={<RewardRevokePage />} />
          <Route path='/point' element={<PointPage />} />
          <Route path='/point/send/:mosaicId' element={<PointSendPage />} />
          <Route path='/point/revoke/:mosaicId' element={<PointRevokePage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
