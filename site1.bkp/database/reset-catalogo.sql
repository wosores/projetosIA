-- Recria o catálogo artesanal de demonstração.
-- ATENÇÃO: este script apaga produtos, pedidos e itens de pedidos existentes.
-- Use apenas em ambiente de desenvolvimento ou antes de abrir a loja.
-- Usuários cadastrados são preservados.

BEGIN;

TRUNCATE TABLE order_items, orders, products RESTART IDENTITY CASCADE;

INSERT INTO products (nome, descricao, preco, categoria, imagem_url, estoque) VALUES
('Bolsa Tote Terracota', 'Bolsa espaçosa costurada à mão em linho e algodão, com forro interno e alças reforçadas.', 189.90, 'Bolsas', 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&q=80', 6),
('Almofada Bordada Jardim', 'Almofada com bordado floral feito ponto a ponto, capa removível e enchimento macio.', 129.90, 'Decoração', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500&q=80', 8),
('Conjunto Infantil Ursinho', 'Macacão em algodão macio com touca, pensado para os primeiros meses do bebê.', 149.90, 'Infantil', 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=500&q=80', 5),
('Kit de Tricô Aquarela', 'Kit com novelos de lã coloridos, agulhas e manual passo a passo para iniciantes.', 119.90, 'Kits', 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&q=80', 15),
('Boneco de Crochê Coelhinho', 'Boneco artesanal em crochê, produzido sob encomenda com fios antialérgicos.', 89.90, 'Crochê', 'https://images.unsplash.com/photo-1615486363973-f79d875780cf?w=500&q=80', 10),
('Mochila em Loneta Azul', 'Mochila resistente em loneta, com bolsos internos, zíper reforçado e alças ajustáveis.', 219.90, 'Bolsas', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80', 4);

COMMIT;
