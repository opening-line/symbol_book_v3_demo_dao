import { BrowserRouter as Router, Route, Routes } from "react-router-dom"

import { CreateDAOPage } from "./pages/DAO/Create"
import { UpdateDAOPage } from "./pages/DAO/Update"
function App() {
  return (
    <Router>
      <Routes>
        <Route path='/dao/create' element={<CreateDAOPage />} />
        <Route path='/dao/update/:id' element={<UpdateDAOPage />} />
      </Routes>
    </Router>
  )
}

export default App
