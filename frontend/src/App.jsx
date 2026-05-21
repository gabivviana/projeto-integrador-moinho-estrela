import { useState, useEffect } from 'react'
import NotaFiscalForm from './components/NotaFiscalForm'
import HistoricoDivergencias from './components/HistoricoDivergencias'
import RankingFornecedores from './components/RankingFornecedores'
import axios from 'axios'

function App() {
  const [activeTab, setActiveTab] = useState('form')
  const [stats, setStats] = useState({ totalNotas: 0, totalDivergencia: 0 })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/notas')
      const notas = response.data
      setStats({
        totalNotas: notas.length,
        totalDivergencia: notas.reduce((acc, nota) => acc + Math.abs(nota.divergencia), 0).toFixed(2)
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    }
  }

  const handleNotaCriada = () => {
    fetchStats()
  }

  return (
    <div className="container">
      <div className="header">
        <img src="/logo.png" alt="Grupo Estrela" />
        <h1>Controle de Divergência de Peso</h1>
      </div>

      <div className="nav">
        <button 
          className={activeTab === 'form' ? 'active' : ''} 
          onClick={() => setActiveTab('form')}
        >
          Nova Nota Fiscal
        </button>
        <button 
          className={activeTab === 'historico' ? 'active' : ''} 
          onClick={() => setActiveTab('historico')}
        >
          Histórico
        </button>
        <button 
          className={activeTab === 'ranking' ? 'active' : ''} 
          onClick={() => setActiveTab('ranking')}
        >
          Ranking
        </button>
      </div>

      <div className="card">
        <p>Total de Notas: {stats.totalNotas}</p>
        <p>Divergência Total: {stats.totalDivergencia} kg</p>
      </div>

      {activeTab === 'form' && <NotaFiscalForm onNotaCriada={handleNotaCriada} />}
      {activeTab === 'historico' && <HistoricoDivergencias />}
      {activeTab === 'ranking' && <RankingFornecedores />}
    </div>
  )
}

export default App
