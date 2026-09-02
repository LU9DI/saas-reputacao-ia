CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    uuid_seguro UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    whatsapp_gestor VARCHAR(20) NOT NULL,
    plano VARCHAR(50) DEFAULT 'basico' NOT NULL,
    status_assinatura VARCHAR(50) DEFAULT 'trial' NOT NULL,
    stripe_customer_id VARCHAR(255) UNIQUE,
    limite_mensal_uso INT DEFAULT 300 NOT NULL,
    contador_uso_atual INT DEFAULT 0 NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE avaliacoes (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
    nota INT CHECK (nota >= 1 AND nota <= 5) NOT NULL,
    comentario TEXT,
    cliente_nome VARCHAR(100),
    cliente_whatsapp VARCHAR(20),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_avaliacoes_empresa ON avaliacoes(empresa_id);
CREATE INDEX idx_avaliacoes_criado_em ON avaliacoes(criado_em);
