import { useState } from 'react'
import axios from 'axios'

function NotaFiscalForm({ onNotaCriada }) {
  const [formData, setFormData] = useState({
    numero_nota: '',
    fornecedor: '',
    data: new Date().toISOString().split('T')[0],
    peso_informado: '',
    peso_real: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.numero_nota || !formData.fornecedor || !formData.peso_informado || !formData.peso_real) {
      setMessage('Preencha todos os campos')
      return
    }

    setLoading(true)

    try {
      await axios.post('http://localhost:5000/api/notas', {
        numero_nota: formData.numero_nota,
        fornecedor: formData.fornecedor,
        data: formData.data,
        peso_informado: parseFloat(formData.peso_informado),
        peso_real: parseFloat(formData.peso_real)
      })

      setMessage('Nota fiscal criada com sucesso!')
      onNotaCriada()
      
      setFormData({
        numero_nota: '',
        fornecedor: '',
        data: new Date().toISOString().split('T')[0],
        peso_informado: '',
        peso_real: ''
      })
    } catch (err) {
      setMessage('Erro ao criar nota fiscal')
    } finally {
      setLoading(false)
    }
  }

  const divergencia = formData.peso_informado && formData.peso_real
    ? (parseFloat(formData.peso_real) - parseFloat(formData.peso_informado)).toFixed(2)
    : '0.00'

  return (
    <div className="card">
      <h2>Nova Nota Fiscal</h2>
      
      {message && <p style={{ color: message.includes('sucesso') ? 'green' : 'red' }}>{message}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Número da Nota:</label>
          <input
            type="text"
            name="numero_nota"
            value={formData.numero_nota}
            onChange={handleChange}
            placeholder="12345"
          />
        </div>

        <div className="form-group">
          <label>Fornecedor:</label>
          <input
            type="text"
            name="fornecedor"
            value={formData.fornecedor}
            onChange={handleChange}
            placeholder="Moinho Rota S.A."
          />
        </div>

        <div className="form-group">
          <label>Data:</label>
          <input
            type="date"
            name="data"
            value={formData.data}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Peso NF:</label>
          <input
            type="number"
            name="peso_informado"
            value={formData.peso_informado}
            onChange={handleChange}
            step="0.01"
            placeholder="kg"
          />
        </div>

        <div className="form-group">
          <label>Peso Real (balança):</label>
          <input
            type="number"
            name="peso_real"
            value={formData.peso_real}
            onChange={handleChange}
            step="0.01"
            placeholder="kg"
          />
        </div>

        {formData.peso_informado && formData.peso_real && (
          <div className="form-group">
            <p>Divergência: <span className={divergencia > 0 ? 'positive' : divergencia < 0 ? 'negative' : ''}>{divergencia} kg</span></p>
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}

export default NotaFiscalForm
