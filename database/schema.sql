CREATE TABLE municipios (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 nome VARCHAR(120) NOT NULL, uf CHAR(2) NOT NULL,
 codigo_ibge VARCHAR(7) UNIQUE NOT NULL, ativo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE usuarios (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 municipio_id INTEGER NOT NULL REFERENCES municipios(id),
 nome VARCHAR(120) NOT NULL, email VARCHAR(180) NOT NULL UNIQUE,
 senha_hash TEXT NOT NULL, perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('cidadao','gestor')),
 ativo BOOLEAN NOT NULL DEFAULT TRUE, criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE categorias (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 nome VARCHAR(100) NOT NULL UNIQUE
);
CREATE TABLE ocorrencias (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 municipio_id INTEGER NOT NULL REFERENCES municipios(id),
 usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
 categoria_id INTEGER NOT NULL REFERENCES categorias(id),
 descricao TEXT NOT NULL, endereco TEXT, bairro VARCHAR(120),
 latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
 longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
 foto_caminho TEXT,
 status VARCHAR(30) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_analise','em_andamento','resolvida','rejeitada')),
 criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(), atualizada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE comentarios (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 ocorrencia_id INTEGER NOT NULL REFERENCES ocorrencias(id),
 usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
 texto TEXT NOT NULL, criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE apoios (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 ocorrencia_id INTEGER NOT NULL REFERENCES ocorrencias(id),
 usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
 criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (ocorrencia_id,usuario_id)
);
CREATE TABLE historico_status (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 ocorrencia_id INTEGER NOT NULL REFERENCES ocorrencias(id),
 gestor_id INTEGER NOT NULL REFERENCES usuarios(id),
 status_anterior VARCHAR(30) NOT NULL, status_novo VARCHAR(30) NOT NULL,
 observacao TEXT, alterado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE notificacoes (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
 ocorrencia_id INTEGER REFERENCES ocorrencias(id),
 mensagem TEXT NOT NULL, lida BOOLEAN NOT NULL DEFAULT FALSE,
 criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_usuarios_municipio ON usuarios(municipio_id);
CREATE INDEX idx_ocorrencias_municipio_status ON ocorrencias(municipio_id,status);
CREATE INDEX idx_ocorrencias_categoria ON ocorrencias(categoria_id);
CREATE INDEX idx_ocorrencias_data ON ocorrencias(criada_em);
CREATE INDEX idx_ocorrencias_bairro ON ocorrencias(municipio_id,bairro);
CREATE INDEX idx_comentarios_ocorrencia ON comentarios(ocorrencia_id);
CREATE INDEX idx_apoios_ocorrencia ON apoios(ocorrencia_id);
CREATE INDEX idx_historico_ocorrencia ON historico_status(ocorrencia_id);
CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id,lida);
