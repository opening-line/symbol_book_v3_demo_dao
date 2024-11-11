import { BrowserRouter as Router, Route, Routes } from "react-router-dom"

import { CreateDAOPage } from "./pages/DAO/Create"
function App() {
  return (
    <Router>
      <Routes>
        <Route path='/dao/create' element={<CreateDAOPage />} />
      </Routes>
    </Router>
  )
}

export default App
