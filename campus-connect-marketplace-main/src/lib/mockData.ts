// Mock data for SCU Campus Trading App

export interface User {
  id: number;
  full_name: string;
  username: string;
  email: string;
  phone_number?: string;
  profile_picture?: string;
  student_id?: string;
  bio?: string;
  date_of_birth?: string;
  gender?: string;
  language?: string;
  timezone?: string;
  dormitory_id?: number;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
}

export interface University {
  id: number;
  name: string;
  domain: string;
  location?: string;
  pic?: string;
}

export interface Dormitory {
  id: number;
  dormitory_name: string;
  domain: string;
  location?: string;
  is_active: boolean;
  university_id: number;
}

export interface Category {
  id: number;
  name: string;
  parent_id?: number;
  icon?: string;
}

export interface ConditionLevel {
  id: number;
  name: string;
  description?: string;
  sort_order: number;
}

export interface Tag {
  id: number;
  name: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  image_thumbnail_url?: string;
  is_primary: boolean;
}

export interface Product {
  id: number;
  seller_id: number;
  seller?: User;
  dormitory_id: number;
  dormitory?: Dormitory;
  category_id: number;
  category?: Category;
  condition_level_id: number;
  condition_level?: ConditionLevel;
  title: string;
  description?: string;
  price: number;
  status: 'available' | 'sold' | 'reserved';
  is_promoted?: boolean;
  created_at: string;
  images: ProductImage[];
  tags: Tag[];
  distance_km?: number;
}

export interface BehavioralEvent {
  id: number;
  user_id: number;
  event_type: 'view' | 'favorite' | 'message' | 'purchase' | 'offer';
  product_id?: number;
  category_id?: number;
  seller_id?: number;
  metadata?: Record<string, unknown>;
  occurred_at: string;
  session_id: string;
}

// Mock Universities
export const mockUniversities: University[] = [
  { id: 1, name: 'State University', domain: 'stateuniv.edu', location: 'Downtown Campus' },
  { id: 2, name: 'Tech Institute', domain: 'techinst.edu', location: 'Innovation Park' },
  { id: 3, name: 'Liberal Arts College', domain: 'liberalarts.edu', location: 'Historic District' },
];

// Mock Dormitories
export const mockDormitories: Dormitory[] = [
  { id: 1, dormitory_name: 'Maple Hall', domain: 'stateuniv.edu', location: 'North Campus', is_active: true, university_id: 1 },
  { id: 2, dormitory_name: 'Oak Residence', domain: 'stateuniv.edu', location: 'East Campus', is_active: true, university_id: 1 },
  { id: 3, dormitory_name: 'Pine Tower', domain: 'techinst.edu', location: 'West Wing', is_active: true, university_id: 2 },
  { id: 4, dormitory_name: 'Cedar House', domain: 'techinst.edu', location: 'Central', is_active: true, university_id: 2 },
  { id: 5, dormitory_name: 'Elm Court', domain: 'liberalarts.edu', location: 'Garden View', is_active: true, university_id: 3 },
];

// Mock Categories
export const mockCategories: Category[] = [
  { id: 1, name: 'Electronics', icon: '💻' },
  { id: 2, name: 'Books & Study Materials', icon: '📚' },
  { id: 3, name: 'Furniture', icon: '🪑' },
  { id: 4, name: 'Clothing', icon: '👕' },
  { id: 5, name: 'Sports & Fitness', icon: '⚽' },
  { id: 6, name: 'Kitchen & Dining', icon: '🍳' },
  { id: 7, name: 'Tickets & Events', icon: '🎟️' },
  { id: 8, name: 'Transportation', icon: '🚲' },
  { id: 9, name: 'Other', icon: '📦' },
];

// Mock Condition Levels
export const mockConditionLevels: ConditionLevel[] = [
  { id: 1, name: 'Like New', description: 'Barely used, excellent condition', sort_order: 1 },
  { id: 2, name: 'Good', description: 'Minor signs of use, fully functional', sort_order: 2 },
  { id: 3, name: 'Fair', description: 'Visible wear but works well', sort_order: 3 },
  { id: 4, name: 'Worn', description: 'Significant wear, still functional', sort_order: 4 },
];

// Mock Tags
export const mockTags: Tag[] = [
  { id: 1, name: 'Textbooks' },
  { id: 2, name: 'Gaming' },
  { id: 3, name: 'Apple' },
  { id: 4, name: 'Dorm Essentials' },
  { id: 5, name: 'Vintage' },
  { id: 6, name: 'Free Delivery' },
  { id: 7, name: 'Negotiable' },
  { id: 8, name: 'Brand New' },
  { id: 9, name: 'Moving Sale' },
  { id: 10, name: 'Graduation Sale' },
];

// Mock Users
export const mockUsers: User[] = [
  {
    id: 1,
    full_name: 'Alex Johnson',
    username: 'alexj',
    email: 'alex.johnson@stateuniv.edu',
    phone_number: '+1234567890',
    profile_picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    student_id: 'SU2021001',
    bio: 'Computer Science major, love tech gadgets!',
    dormitory_id: 1,
    role: 'user',
    status: 'active',
  },
  {
    id: 2,
    full_name: 'Sarah Chen',
    username: 'sarahc',
    email: 'sarah.chen@techinst.edu',
    profile_picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    bio: 'Engineering student, selling old course materials',
    dormitory_id: 3,
    role: 'user',
    status: 'active',
  },
  {
    id: 3,
    full_name: 'Mike Williams',
    username: 'mikew',
    email: 'mike.williams@stateuniv.edu',
    profile_picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    bio: 'Senior year, clearing out my room!',
    dormitory_id: 2,
    role: 'user',
    status: 'active',
  },
  {
    id: 4,
    full_name: 'Admin User',
    username: 'admin',
    email: 'admin@SCU.edu',
    role: 'admin',
    status: 'active',
  },
];

// Mock Products
export const mockProducts: Product[] = [
  {
    id: 1,
    seller_id: 1,
    seller: mockUsers[0],
    dormitory_id: 1,
    dormitory: mockDormitories[0],
    category_id: 1,
    category: mockCategories[0],
    condition_level_id: 1,
    condition_level: mockConditionLevels[0],
    title: 'MacBook Pro 2021 M1',
    description: 'Selling my MacBook Pro M1 chip, 16GB RAM, 512GB SSD. Perfect condition, includes original charger and box. Great for coding and design work!',
    price: 1200,
    status: 'available',
    is_promoted: true,
    created_at: '2024-01-15T10:30:00Z',
    images: [
      { id: 1, product_id: 1, image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop', is_primary: true },
      { id: 2, product_id: 1, image_url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&h=400&fit=crop', is_primary: false },
    ],
    tags: [mockTags[2], mockTags[7]],
    distance_km: 0.3,
  },
  {
    id: 2,
    seller_id: 2,
    seller: mockUsers[1],
    dormitory_id: 3,
    dormitory: mockDormitories[2],
    category_id: 2,
    category: mockCategories[1],
    condition_level_id: 2,
    condition_level: mockConditionLevels[1],
    title: 'Calculus & Linear Algebra Textbooks Bundle',
    description: 'Complete set of Math textbooks for first year engineering. Some highlighting but all in good condition.',
    price: 75,
    status: 'available',
    created_at: '2024-01-14T15:45:00Z',
    images: [
      { id: 3, product_id: 2, image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[0], mockTags[6]],
    distance_km: 1.2,
  },
  {
    id: 3,
    seller_id: 3,
    seller: mockUsers[2],
    dormitory_id: 2,
    dormitory: mockDormitories[1],
    category_id: 3,
    category: mockCategories[2],
    condition_level_id: 2,
    condition_level: mockConditionLevels[1],
    title: 'IKEA Desk with Chair',
    description: 'Perfect study desk with ergonomic chair. Moving out so need to sell quick! Can help with delivery on campus.',
    price: 120,
    status: 'available',
    is_promoted: true,
    created_at: '2024-01-13T09:00:00Z',
    images: [
      { id: 4, product_id: 3, image_url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[3], mockTags[5], mockTags[8]],
    distance_km: 0.5,
  },
  {
    id: 4,
    seller_id: 1,
    seller: mockUsers[0],
    dormitory_id: 1,
    dormitory: mockDormitories[0],
    category_id: 1,
    category: mockCategories[0],
    condition_level_id: 1,
    condition_level: mockConditionLevels[0],
    title: 'Sony WH-1000XM4 Headphones',
    description: 'Best noise-cancelling headphones. Bought 3 months ago, selling because I got AirPods as a gift.',
    price: 180,
    status: 'available',
    created_at: '2024-01-12T14:20:00Z',
    images: [
      { id: 5, product_id: 4, image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[1], mockTags[7]],
    distance_km: 0.3,
  },
  {
    id: 5,
    seller_id: 2,
    seller: mockUsers[1],
    dormitory_id: 3,
    dormitory: mockDormitories[2],
    category_id: 5,
    category: mockCategories[4],
    condition_level_id: 3,
    condition_level: mockConditionLevels[2],
    title: 'Yoga Mat & Resistance Bands Set',
    description: 'Complete home workout kit. Yoga mat, resistance bands, and jump rope. Perfect for dorm workouts!',
    price: 35,
    status: 'available',
    created_at: '2024-01-11T11:00:00Z',
    images: [
      { id: 6, product_id: 5, image_url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[3], mockTags[6]],
    distance_km: 1.2,
  },
  {
    id: 6,
    seller_id: 3,
    seller: mockUsers[2],
    dormitory_id: 2,
    dormitory: mockDormitories[1],
    category_id: 8,
    category: mockCategories[7],
    condition_level_id: 2,
    condition_level: mockConditionLevels[1],
    title: 'Trek Mountain Bike',
    description: 'Great campus bike! Some scratches but rides perfectly. Just had the brakes serviced.',
    price: 250,
    status: 'available',
    is_promoted: true,
    created_at: '2024-01-10T16:30:00Z',
    images: [
      { id: 7, product_id: 6, image_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[6], mockTags[9]],
    distance_km: 0.5,
  },
  {
    id: 7,
    seller_id: 1,
    seller: mockUsers[0],
    dormitory_id: 1,
    dormitory: mockDormitories[0],
    category_id: 6,
    category: mockCategories[5],
    condition_level_id: 1,
    condition_level: mockConditionLevels[0],
    title: 'Instant Pot Duo 6 Qt',
    description: 'Perfect for dorm cooking! Used only a few times. Comes with all accessories and recipe book.',
    price: 55,
    status: 'available',
    created_at: '2024-01-09T08:15:00Z',
    images: [
      { id: 8, product_id: 7, image_url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[3], mockTags[7]],
    distance_km: 0.3,
  },
  {
    id: 8,
    seller_id: 2,
    seller: mockUsers[1],
    dormitory_id: 3,
    dormitory: mockDormitories[2],
    category_id: 4,
    category: mockCategories[3],
    condition_level_id: 1,
    condition_level: mockConditionLevels[0],
    title: 'Vintage Levi\'s Denim Jacket',
    description: 'Authentic 90s Levi\'s jacket. Size M. Great condition, barely worn.',
    price: 65,
    status: 'available',
    created_at: '2024-01-08T13:45:00Z',
    images: [
      { id: 9, product_id: 8, image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[4], mockTags[6]],
    distance_km: 1.2,
  },
];

// Current logged-in user (for demo)
export const currentUser: User = mockUsers[0];

// Mock favorites
export const mockFavorites: number[] = [2, 4, 6];

// Helper functions
export const getProductById = (id: number): Product | undefined => {
  return mockProducts.find(p => p.id === id);
};

export const getProductsByCategory = (categoryName: string): Product[] => {
  const category = mockCategories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
  if (!category) return [];
  return mockProducts.filter(p => p.category_id === category.id);
};

export const getProductsByTag = (tagName: string): Product[] => {
  return mockProducts.filter(p => p.tags.some(t => t.name.toLowerCase() === tagName.toLowerCase()));
};

export const getUserProducts = (userId: number): Product[] => {
  return mockProducts.filter(p => p.seller_id === userId);
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};
