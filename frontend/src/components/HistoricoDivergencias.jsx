import { useState, useEffect } from 'react'
import axios from 'axios'

function HistoricoDivergencias() {
  const [notas, setNotas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotas()
  }, [])

  const fetchNotas = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/notas')
      setNotas(response.data)
    } catch (error) {
      console.error('Erro ao buscar notas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar esta nota fiscal?')) {
      return
    }

    try {
      await axios.delete(`http://localhost:5000/api/notas/${id}`)
      fetchNotas()
    } catch (error) {
      alert('Erro ao deletar nota fiscal')
    }
  }

  if (loading) {
    return <p>Carregando...</p>
  }

  return (
    <div className="card">
      <h2>Histórico de Divergências</h2>
      
      {notas.length === 0 ? (
        <p>Nenhuma nota fiscal encontrada</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Nº Nota</th>
              <th>Fornecedor</th>
              <th>Peso Informado</th>
              <th>Peso Real</th>
              <th>Divergência</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {notas.map((nota) => (
              <tr key={nota.id}>
                <td>{new Date(nota.data).toLocaleDateString('pt-BR')}</td>
                <td>{nota.numero_nota}</td>
                <td>{nota.fornecedor}</td>
                <td>{nota.peso_informado.toFixed(2)} kg</td>
                <td>{nota.peso_real.toFixed(2)} kg</td>
                <td className={nota.divergencia > 0 ? 'positive' : nota.divergencia < 0 ? 'negative' : ''}>
                  {nota.divergencia > 0 ? '+' : ''}{nota.divergencia.toFixed(2)} kg
                </td>
                <td>
                  <button 
                    className="delete" 
                    onClick={() => handleDelete(nota.id)}
                  >
                    Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default HistoricoDivergencias
