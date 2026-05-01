from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "divergencias.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Model
class NotaFiscal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    numero_nota = db.Column(db.String(50), nullable=False)
    fornecedor = db.Column(db.String(200), nullable=False)
    data = db.Column(db.Date, nullable=False)
    peso_informado = db.Column(db.Float, nullable=False)
    peso_real = db.Column(db.Float, nullable=False)
    divergencia = db.Column(db.Float, nullable=False)
    data_cadastro = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'numero_nota': self.numero_nota,
            'fornecedor': self.fornecedor,
            'data': self.data.strftime('%Y-%m-%d') if self.data else None,
            'peso_informado': self.peso_informado,
            'peso_real': self.peso_real,
            'divergencia': self.divergencia,
            'data_cadastro': self.data_cadastro.strftime('%Y-%m-%d %H:%M:%S') if self.data_cadastro else None
        }

# API Routes

@app.route('/api/notas', methods=['POST'])
def criar_nota():
    data = request.get_json()
    
    try:
        peso_informado = float(data['peso_informado'])
        peso_real = float(data['peso_real'])
        divergencia = peso_real - peso_informado
        
        nota = NotaFiscal(
            numero_nota=data['numero_nota'],
            fornecedor=data['fornecedor'],
            data=datetime.strptime(data['data'], '%Y-%m-%d').date(),
            peso_informado=peso_informado,
            peso_real=peso_real,
            divergencia=divergencia
        )
        
        db.session.add(nota)
        db.session.commit()
        
        return jsonify(nota.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/notas', methods=['GET'])
def listar_notas():
    fornecedor = request.args.get('fornecedor')
    
    query = NotaFiscal.query
    if fornecedor:
        query = query.filter(NotaFiscal.fornecedor.ilike(f'%{fornecedor}%'))
    
    notas = query.order_by(NotaFiscal.data_cadastro.desc()).all()
    return jsonify([nota.to_dict() for nota in notas])

@app.route('/api/notas/<int:id>', methods=['GET'])
def obter_nota(id):
    nota = NotaFiscal.query.get_or_404(id)
    return jsonify(nota.to_dict())

@app.route('/api/notas/<int:id>', methods=['DELETE'])
def deletar_nota(id):
    nota = NotaFiscal.query.get_or_404(id)
    db.session.delete(nota)
    db.session.commit()
    return jsonify({'message': 'Nota fiscal deletada com sucesso'})

@app.route('/api/ranking-fornecedores', methods=['GET'])
def ranking_fornecedores():
    # Calculate ranking by supplier based on divergence count and average divergence
    query = db.session.query(
        NotaFiscal.fornecedor,
        db.func.count(NotaFiscal.id).label('total_notas'),
        db.func.sum(db.func.abs(NotaFiscal.divergencia)).label('soma_divergencia'),
        db.func.avg(db.func.abs(NotaFiscal.divergencia)).label('media_divergencia')
    ).group_by(NotaFiscal.fornecedor).all()
    
    ranking = []
    for row in query:
        ranking.append({
            'fornecedor': row.fornecedor,
            'total_notas': row.total_notas,
            'soma_divergencia': round(row.soma_divergencia, 2),
            'media_divergencia': round(row.media_divergencia, 2)
        })
    
    # Sort by total divergence (sum of absolute divergences)
    ranking.sort(key=lambda x: x['soma_divergencia'], reverse=True)
    
    return jsonify(ranking)

@app.route('/api/fornecedores', methods=['GET'])
def listar_fornecedores():
    fornecedores = db.session.query(NotaFiscal.fornecedor).distinct().all()
    return jsonify([f[0] for f in fornecedores])

@app.route('/api/divergencias/fornecedor', methods=['GET'])
def divergencias_por_fornecedor():
    fornecedor = request.args.get('fornecedor')
    
    if not fornecedor:
        return jsonify({'error': 'Fornecedor não informado'}), 400
    
    notas = NotaFiscal.query.filter(
        NotaFiscal.fornecedor.ilike(f'%{fornecedor}%')
    ).order_by(NotaFiscal.data_cadastro.desc()).all()
    
    return jsonify([nota.to_dict() for nota in notas])

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'API funcionando corretamente'})

# Create database tables
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
