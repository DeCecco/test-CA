export type ProductStatus = 'disponible' | 'reservado' | 'vendido';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  priceUSD: number;
  priceUYU: number;
  score: number; // 1 to 5 (5 is high-value premium, 1 is almost valueless/low rating)
  imageUrl: string;
  images?: string[]; // Multiple extra images
  videoUrl?: string; // Optional video URL or HTML5/YouTube embed
  status: ProductStatus;
  isOfferBonus?: boolean; // Can be claimed or won as gift
  raffleWeight?: number; // Relative weight in the surprise box raffle (e.g. 100 standard, 10 rare)
  isVisible?: boolean; // Option to show/hide product from catalog
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface MysteryBoxPrize {
  product: Product;
  type: 'free' | 'discount';
  discountPercentage?: number;
}
