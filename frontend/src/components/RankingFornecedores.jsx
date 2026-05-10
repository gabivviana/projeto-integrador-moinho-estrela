import { useState, useEffect } from 'react'
import axios from 'axios'

function RankingFornecedores() {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRanking()
  }, [])

  const fetchRanking = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/ranking-fornecedores')
      setRanking(response.data)
    } catch (error) {
      console.error('Erro ao buscar ranking:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <p>Carregando...</p>
  }

  return (
    <div className="card">
      <h2>Ranking de Fornecedores</h2>
      
      {ranking.length === 0 ? (
        <p>Nenhum fornecedor cadastrado</p>
      ) : (
        <div>
          <p>Total de fornecedores: {ranking.length}</p>
          
          {ranking.length > 0 && (
            <p>Maior divergência: {ranking[0].fornecedor} ({ranking[0].soma_divergencia.toFixed(2)} kg)</p>
          )}
          
          <table>
            <thead>
              <tr>
                <th>Posição</th>
                <th>Fornecedor</th>
                <th>Total de Notas</th>
                <th>Divergência Total</th>
                <th>Média por Nota</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((item, index) => (
                <tr key={item.fornecedor}>
                  <td>
                    <span className="rank-badge">{index + 1}</span>
                  </td>
                  <td>{item.fornecedor}</td>
                  <td>{item.total_notas}</td>
                  <td className="negative">{item.soma_divergencia.toFixed(2)} kg</td>
                  <td>{item.media_divergencia.toFixed(2)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default RankingFornecedores
