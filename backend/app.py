from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///divergencias.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class NotaFiscal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    numero_nota = db.Column(db.String(50), nullable=False)
    fornecedor = db.Column(db.String(200), nullable=False)
    data = db.Column(db.Date, nullable=False)
    peso_informado = db.Column(db.Float, nullable=False)
    peso_real = db.Column(db.Float, nullable=False)
    divergencia = db.Column(db.Float, nullable=False)
    data_cadastro = db.Column(db.DateTime, default=datetime.utcnow)

@app.route('/api/notas', methods=['POST'])
def criar_nota():
    data = request.get_json()
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
    
    return jsonify({
        'id': nota.id,
        'numero_nota': nota.numero_nota,
        'fornecedor': nota.fornecedor,
        'data': nota.data.strftime('%Y-%m-%d'),
        'peso_informado': nota.peso_informado,
        'peso_real': nota.peso_real,
        'divergencia': nota.divergencia
    }), 201

@app.route('/api/notas', methods=['GET'])
def listar_notas():
    notas = NotaFiscal.query.order_by(NotaFiscal.data_cadastro.desc()).all()
    resultado = []
    for nota in notas:
        resultado.append({
            'id': nota.id,
            'numero_nota': nota.numero_nota,
            'fornecedor': nota.fornecedor,
            'data': nota.data.strftime('%Y-%m-%d'),
            'peso_informado': nota.peso_informado,
            'peso_real': nota.peso_real,
            'divergencia': nota.divergencia
        })
    return jsonify(resultado)

@app.route('/api/notas/<int:id>', methods=['DELETE'])
def deletar_nota(id):
    nota = NotaFiscal.query.get_or_404(id)
    db.session.delete(nota)
    db.session.commit()
    return jsonify({'message': 'Nota deletada'})

@app.route('/api/ranking-fornecedores', methods=['GET'])
def ranking_fornecedores():
    fornecedores = db.session.query(NotaFiscal.fornecedor).distinct().all()
    ranking = []
    
    for f in fornecedores:
        nome = f[0]
        notas = NotaFiscal.query.filter_by(fornecedor=nome).all()
        total_notas = len(notas)
        soma_divergencia = sum(abs(n.divergencia) for n in notas)
        media_divergencia = soma_divergencia / total_notas if total_notas > 0 else 0
        
        ranking.append({
            'fornecedor': nome,
            'total_notas': total_notas,
            'soma_divergencia': round(soma_divergencia, 2),
            'media_divergencia': round(media_divergencia, 2)
        })
    
    ranking.sort(key=lambda x: x['soma_divergencia'], reverse=True)
    return jsonify(ranking)

@app.route('/api/fornecedores', methods=['GET'])
def listar_fornecedores():
    fornecedores = db.session.query(NotaFiscal.fornecedor).distinct().all()
    return jsonify([f[0] for f in fornecedores])

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
