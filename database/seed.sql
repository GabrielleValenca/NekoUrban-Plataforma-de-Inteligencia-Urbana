INSERT INTO municipios (nome,uf,codigo_ibge) VALUES ('Sorocaba','SP','3552205') ON CONFLICT (codigo_ibge) DO NOTHING;
INSERT INTO categorias(nome) VALUES ('Buraco na via'),('Calçada danificada'),('Iluminação pública'),('Descarte irregular de lixo') ON CONFLICT(nome) DO NOTHING;
