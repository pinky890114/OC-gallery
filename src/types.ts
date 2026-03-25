export interface WardrobeItem {
  id: string;
  name: string;
  imageUrl: string;
}

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  title?: string;
}

export interface Character {
  id: string;
  name: string;
  japaneseName?: string;
  posterUrl: string;
  description: string;
  settings: {
    age: string;
    height: string;
    personality: string;
    likes: string[];
  };
  wardrobe: WardrobeItem[];
  portfolio: PortfolioItem[];
  createdAt?: any;
}
