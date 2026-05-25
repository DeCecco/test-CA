import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Heladera con Freezer Patrick',
    description: 'Excelente estado, 350 litros, muy poco consumo y excelente congelamiento. Ideal para familias. Se retira por Pocitos.',
    category: 'Cocina y Electrodomésticos',
    priceUSD: 420,
    priceUYU: 16800,
    score: 5,
    imageUrl: 'https://images.unsplash.com/photo-1571175482181-4467f65341d4?auto=format&fit=crop&q=80&w=600',
    status: 'disponible'
  },
  {
    id: '2',
    name: 'Sofá de 3 Cuerpos Gris Tapizado',
    description: 'Estructura hiper firme, tela lavable antimanchas. Muy cómodo, ideal para ver películas. Medidas: 2.10m de largo.',
    category: 'Muebles y Hogar',
    priceUSD: 290,
    priceUYU: 11600,
    score: 5,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600',
    status: 'disponible'
  },
  {
    id: '3',
    name: 'Bicicleta de Montaña GT Avalanche',
    description: 'Rodado 29, talle M, frenos de disco hidráulicos, transmisión Shimano de 24 velocidades. Se le hizo service hace un mes. Va con candado de regalo.',
    category: 'Deportes y Aire Libre',
    priceUSD: 380,
    priceUYU: 15200,
    score: 5,
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=600',
    status: 'disponible'
  },
  {
    id: '4',
    name: 'Smart TV AOC 43" Full HD',
    description: 'Poco uso en el dormitorio, tiene aplicaciones nativas como Netflix, YouTube y Prime Video. Incluye control original. Funciona excelente.',
    category: 'Electrónica y Oficina',
    priceUSD: 195,
    priceUYU: 7800,
    score: 4,
    imageUrl: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=600',
    status: 'disponible'
  },
  {
    id: '5',
    name: 'Combo Uruguayo: Mate de Camión + Termo Stanley',
    description: 'Mate de porongo forrado en cuero legítimo con virola de alpaca. Termo Stanley verde clásico de 1.2 litros de retención térmica perfecta. Compañeros de viajes.',
    category: 'Libros, Juegos y Regalos',
    priceUSD: 75,
    priceUYU: 3000,
    score: 4,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=600',
    status: 'disponible'
  },
  {
    id: '6',
    name: 'Mesa de Comedor Nórdica + 4 Sillas',
    description: 'Mesa sólida de madera clara con patas laqueadas blancas. Sillas haciendo juego con almohadón gris integrado. Muy cuidada, divina estética.',
    category: 'Muebles y Hogar',
    priceUSD: 180,
    priceUYU: 7200,
    score: 4,
    imageUrl: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&q=80&w=600',
    status: 'disponible'
  },
  {
    id: '7',
    name: 'Licuadora de Vaso Philips 2L',
    description: 'Cuchillas de acero inoxidable ProBlend. 5 velocidades más opción de pulso. Ideal para licuados matutinos y sopas. Licúa hielo sin problemas.',
    category: 'Cocina y Electrodomésticos',
    priceUSD: 35,
    priceUYU: 1400,
    score: 3,
    imageUrl: 'https://images.unsplash.com/photo-1578643463396-0997cb5328c1?auto=format&fit=crop&q=80&w=600',
    status: 'disponible'
  },
  {
    id: '8',
    name: 'Lámpara de Escritorio LED Inteligente',
    description: 'Variación de luz fría a cálida, tiene regulador de intensidad táctil y puerto USB integrado detrás para cargar el celular.',
    category: 'Electrónica y Oficina',
    priceUSD: 20,
    priceUYU: 800,
    score: 2,
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=600',
    status: 'disponible',
    isOfferBonus: true
  },
  {
    id: '9',
    name: 'Cafetera de Filtro Eléctrica Philco',
    description: 'Capacidad para 12 pocillos. Mantiene la jarra caliente de forma automática. Súper práctica, se limpia en un segundo.',
    category: 'Cocina y Electrodomésticos',
    priceUSD: 22,
    priceUYU: 880,
    score: 2,
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29dd049b90?auto=format&fit=crop&q=80&w=600',
    status: 'disponible',
    isOfferBonus: true
  },
  {
    id: '10',
    name: 'Maceta de Barro Divina + Planta de Interior',
    description: 'Una hermosa planta lazo de amor, ideal para renovar el aire de tu living. La maceta de barro cocido pintada a mano le da un toque rústico único.',
    category: 'Herramientas y Plantas',
    priceUSD: 10,
    priceUYU: 400,
    score: 1,
    imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=600',
    status: 'disponible',
    isOfferBonus: true
  },
  {
    id: '11',
    name: 'Taza de Cerámica "Cabo Polonio" Hecha a Mano',
    description: 'Diseño rústico único de talleres de artesanos de Rocha. Ideal para tus desayunos sintiendo la brisa marítima tranquila. Sin detalles o trizaduras.',
    category: 'Libros, Juegos y Regalos',
    priceUSD: 6,
    priceUYU: 240,
    score: 1,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=600',
    status: 'disponible',
    isOfferBonus: true
  },
  {
    id: '12',
    name: 'Set de Herramientas del Hogar (Básico)',
    description: 'Martillo de carpintero mango de goma, set de destornilladores Philips y planos, y una pinza universal de presión. Todo lo que precisás para zafar de un apuro en casa.',
    category: 'Herramientas y Plantas',
    priceUSD: 15,
    priceUYU: 600,
    score: 2,
    imageUrl: 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?auto=format&fit=crop&q=80&w=600',
    status: 'disponible',
    isOfferBonus: true
  },
  {
    id: '13',
    name: 'Libro "Conversaciones con el destino" de Julio María Sanguinetti',
    description: 'Tapa blanda, impecable estado físico, fue leído apenas una vez. Para coleccionistas e interesados en la historia del Uruguay contemporáneo.',
    category: 'Libros, Juegos y Regalos',
    priceUSD: 8,
    priceUYU: 320,
    score: 1,
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600',
    status: 'disponible',
    isOfferBonus: true
  },
  {
    id: '14',
    name: 'Auriculares Regulables de Vincha Philips',
    description: 'Cable largo reforzado, sonido excelente de gran definición física, almohadillas en perfectas condiciones de higiene y suavidad.',
    category: 'Electrónica y Oficina',
    priceUSD: 18,
    priceUYU: 720,
    score: 2,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
    status: 'disponible',
    isOfferBonus: true
  }
];

export const CATEGORIES = [
  'Todos',
  'Cocina y Electrodomésticos',
  'Muebles y Hogar',
  'Deportes y Aire Libre',
  'Electrónica y Oficina',
  'Herramientas y Plantas',
  'Libros, Juegos y Regalos'
];
