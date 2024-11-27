import { BrowserRouter as Router, Route, Routes } from "react-router-dom"

import { CreateDAOPage } from "./pages/DAO/Create"

import { UpdateDAOPage } from "./pages/DAO/Update"
import { RewardPage } from "./pages/Reward"
import { VotePage } from "./pages/Vote"

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/dao/create' element={<CreateDAOPage />} />
        <Route path='/dao/:id/update' element={<UpdateDAOPage />} />
        <Route path='/dao/:id/reward' element={<RewardPage />} />
        <Route path='/dao/:id/vote' element={<VotePage />} />
      </Routes>
    </Router>
  )
}

export default App
