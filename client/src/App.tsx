import { BrowserRouter as Router, Route, Routes } from "react-router-dom"

import { CreateDAOPage } from "./pages/DAO/Create"

import { UpdateDAOPage } from "./pages/DAO/Update"
import { RewardPaga } from "./pages/Reward"

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/dao/create' element={<CreateDAOPage />} />
        <Route path='/dao/:id/update' element={<UpdateDAOPage />} />
        <Route path='/dao/:id/reward' element={<RewardPaga />} />
      </Routes>
    </Router>
  )
}

export default App
