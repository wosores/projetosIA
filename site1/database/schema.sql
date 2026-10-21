-- Criação do banco de dados para o E-commerce de Produtos Artesanais

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos (peças artesanais de costura)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco NUMERIC(10, 2) NOT NULL,
    categoria VARCHAR(100) NOT NULL DEFAULT 'Bolsas',
    imagem_url VARCHAR(500),
    estoque INT NOT NULL DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    produto_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantidade INT NOT NULL DEFAULT 1,
    preco_unitario NUMERIC(10, 2) NOT NULL
);

-- Inserção de dados de exemplo (Seed de Produtos)
-- Executa apenas quando a tabela está vazia, para permitir rodar o schema novamente.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM products) THEN
        INSERT INTO products (nome, descricao, preco, categoria, imagem_url, estoque) VALUES
        ('Bolsa Tote Terracota', 'Bolsa espaçosa costurada à mão em linho e algodão, com forro interno e alças reforçadas.', 189.90, 'Bolsas', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&q=80', 6),
        ('Almofada Bordada Jardim', 'Almofada com bordado floral feito ponto a ponto, capa removível e enchimento macio.', 129.90, 'Decoração', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500&q=80', 8),
        ('Conjunto Infantil Ursinho', 'Macacão em algodão macio com touca, pensado para os primeiros meses do bebê.', 149.90, 'Infantil', 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=500&q=80', 5),
        ('Kit de Tricô Aquarela', 'Kit com novelos de lã coloridos, agulhas e manual passo a passo para iniciantes.', 119.90, 'Kits', 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&q=80', 15),
        ('Boneco de Crochê Coelhinho', 'Boneco artesanal em crochê, produzido sob encomenda com fios antialérgicos.', 89.90, 'Crochê', 'https://images.unsplash.com/photo-1615486363973-f79d875780cf?w=500&q=80', 10),
        ('Mochila em Loneta Azul', 'Mochila resistente em loneta, com bolsos internos, zíper reforçado e alças ajustáveis.', 219.90, 'Bolsas', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80', 4);
    END IF;
END
$$;
