// Mock data for Suki Campus Trading App

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
  account_completed?: boolean;
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
  lat?: number;
  lng?: number;
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
  currency?: string;
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
  { id: 4, name: 'Dalian University', domain: 'dlu.edu.cn', location: 'Dalian, China' },
];

// Mock Dormitories
export const mockDormitories: Dormitory[] = [
  {
    id: 1,
    dormitory_name: 'Maple Hall',
    domain: 'stateuniv.edu',
    location: 'North Campus',
    lat: 35.8682,
    lng: 104.1835,
    is_active: true,
    university_id: 1,
  },
  {
    id: 2,
    dormitory_name: 'Oak Residence',
    domain: 'stateuniv.edu',
    location: 'East Campus',
    lat: 35.8621,
    lng: 104.2012,
    is_active: true,
    university_id: 1,
  },
  {
    id: 3,
    dormitory_name: 'Pine Tower',
    domain: 'techinst.edu',
    location: 'West Wing',
    lat: 35.8544,
    lng: 104.1769,
    is_active: true,
    university_id: 2,
  },
  {
    id: 4,
    dormitory_name: 'Cedar House',
    domain: 'techinst.edu',
    location: 'Central',
    lat: 35.8725,
    lng: 104.1951,
    is_active: true,
    university_id: 2,
  },
  {
    id: 5,
    dormitory_name: 'Elm Court',
    domain: 'liberalarts.edu',
    location: 'Garden View',
    lat: 35.8587,
    lng: 104.2104,
    is_active: true,
    university_id: 3,
  },
  {
    id: 6,
    dormitory_name: 'Xinghai Residence',
    domain: 'dlu.edu.cn',
    location: 'Xinghai Bay, Dalian',
    lat: 38.8819,
    lng: 121.587,
    is_active: true,
    university_id: 4,
  },
  {
    id: 7,
    dormitory_name: 'Lushun Hall',
    domain: 'dlu.edu.cn',
    location: 'Lushun Campus, Dalian',
    lat: 38.8115,
    lng: 121.2631,
    is_active: true,
    university_id: 4,
  },
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
    full_name: 'Li Wei',
    username: 'liwei',
    email: 'li.wei@dlu.edu.cn',
    profile_picture: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face',
    bio: 'Dalian student, selling dorm essentials.',
    dormitory_id: 6,
    role: 'user',
    status: 'active',
  },
  {
    id: 5,
    full_name: 'Zhang Min',
    username: 'zhangm',
    email: 'zhang.min@dlu.edu.cn',
    profile_picture: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=150&h=150&fit=crop&crop=face',
    bio: 'Campus life in Dalian, clearing out extra items.',
    dormitory_id: 7,
    role: 'user',
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
  {
    id: 9,
    seller_id: 3,
    seller: mockUsers[2],
    dormitory_id: 2,
    dormitory: mockDormitories[1],
    category_id: 2,
    category: mockCategories[1],
    condition_level_id: 3,
    condition_level: mockConditionLevels[2],
    title: 'Organic Chemistry Lab Kit',
    description: 'Complete lab kit with goggles, gloves, and glassware. Great for chem students.',
    price: 40,
    status: 'available',
    created_at: '2024-01-07T10:05:00Z',
    images: [
      { id: 10, product_id: 9, image_url: 'https://images.unsplash.com/photo-1559757175-08c984b7f7ce?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[0], mockTags[6]],
    distance_km: 0.8,
  },
  {
    id: 10,
    seller_id: 1,
    seller: mockUsers[0],
    dormitory_id: 1,
    dormitory: mockDormitories[0],
    category_id: 1,
    category: mockCategories[0],
    condition_level_id: 2,
    condition_level: mockConditionLevels[1],
    title: 'iPad Air 4th Gen 64GB',
    description: 'Great for notes and drawing. Includes Apple Pencil alternative and case.',
    price: 320,
    status: 'available',
    created_at: '2024-01-06T18:20:00Z',
    images: [
      { id: 11, product_id: 10, image_url: 'https://images.unsplash.com/photo-1510552776732-03e61cf4b144?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[2], mockTags[7]],
    distance_km: 0.4,
  },
  {
    id: 11,
    seller_id: 2,
    seller: mockUsers[1],
    dormitory_id: 3,
    dormitory: mockDormitories[2],
    category_id: 3,
    category: mockCategories[2],
    condition_level_id: 2,
    condition_level: mockConditionLevels[1],
    title: 'Full-Length Mirror',
    description: 'Tall mirror with white frame. Minor scuffs, still looks great.',
    price: 25,
    status: 'available',
    created_at: '2024-01-06T09:50:00Z',
    images: [
      { id: 12, product_id: 11, image_url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[3], mockTags[9]],
    distance_km: 1.4,
  },
  {
    id: 12,
    seller_id: 3,
    seller: mockUsers[2],
    dormitory_id: 2,
    dormitory: mockDormitories[1],
    category_id: 6,
    category: mockCategories[5],
    condition_level_id: 1,
    condition_level: mockConditionLevels[0],
    title: 'Electric Kettle 1.7L',
    description: 'Fast boil kettle, perfect for tea and ramen in the dorm.',
    price: 18,
    status: 'available',
    created_at: '2024-01-05T12:00:00Z',
    images: [
      { id: 13, product_id: 12, image_url: 'https://images.unsplash.com/photo-1510627498534-cf7e9002facc?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[3], mockTags[8]],
    distance_km: 0.6,
  },
  {
    id: 13,
    seller_id: 1,
    seller: mockUsers[0],
    dormitory_id: 1,
    dormitory: mockDormitories[0],
    category_id: 4,
    category: mockCategories[3],
    condition_level_id: 2,
    condition_level: mockConditionLevels[1],
    title: 'Campus Hoodie Set',
    description: 'Two hoodies, sizes M and L. Cozy and barely worn.',
    price: 30,
    status: 'available',
    created_at: '2024-01-05T08:30:00Z',
    images: [
      { id: 14, product_id: 13, image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[4], mockTags[6]],
    distance_km: 0.3,
  },
  {
    id: 14,
    seller_id: 2,
    seller: mockUsers[1],
    dormitory_id: 3,
    dormitory: mockDormitories[2],
    category_id: 5,
    category: mockCategories[4],
    condition_level_id: 1,
    condition_level: mockConditionLevels[0],
    title: 'Adjustable Dumbbell Set',
    description: 'Pair of adjustable dumbbells with plates. Great for dorm workouts.',
    price: 85,
    status: 'available',
    created_at: '2024-01-04T17:40:00Z',
    images: [
      { id: 15, product_id: 14, image_url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[3], mockTags[6]],
    distance_km: 1.3,
  },
  {
    id: 15,
    seller_id: 3,
    seller: mockUsers[2],
    dormitory_id: 2,
    dormitory: mockDormitories[1],
    category_id: 2,
    category: mockCategories[1],
    condition_level_id: 2,
    condition_level: mockConditionLevels[1],
    title: 'Programming Interview Prep Books',
    description: 'Two popular interview prep books. Helpful for CS students.',
    price: 28,
    status: 'available',
    created_at: '2024-01-04T08:15:00Z',
    images: [
      { id: 16, product_id: 15, image_url: 'https://images.unsplash.com/photo-1455885661740-29cbf08a42fa?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[0], mockTags[6]],
    distance_km: 0.9,
  },
  {
    id: 16,
    seller_id: 1,
    seller: mockUsers[0],
    dormitory_id: 1,
    dormitory: mockDormitories[0],
    category_id: 8,
    category: mockCategories[7],
    condition_level_id: 2,
    condition_level: mockConditionLevels[1],
    title: 'Electric Scooter',
    description: 'Folding e-scooter, good battery life. Great for campus commute.',
    price: 280,
    status: 'available',
    created_at: '2024-01-03T14:25:00Z',
    images: [
      { id: 17, product_id: 16, image_url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[6], mockTags[9]],
    distance_km: 0.4,
  },
  {
    id: 17,
    seller_id: 2,
    seller: mockUsers[1],
    dormitory_id: 3,
    dormitory: mockDormitories[2],
    category_id: 6,
    category: mockCategories[5],
    condition_level_id: 1,
    condition_level: mockConditionLevels[0],
    title: 'Mini Fridge 3.2 cu ft',
    description: 'Compact fridge with freezer. Perfect for dorm snacks and drinks.',
    price: 95,
    status: 'available',
    created_at: '2024-01-03T09:10:00Z',
    images: [
      { id: 18, product_id: 17, image_url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[3], mockTags[8]],
    distance_km: 1.1,
  },
  {
    id: 18,
    seller_id: 3,
    seller: mockUsers[2],
    dormitory_id: 2,
    dormitory: mockDormitories[1],
    category_id: 7,
    category: mockCategories[6],
    condition_level_id: 1,
    condition_level: mockConditionLevels[0],
    title: 'Concert Tickets - 2 Seats',
    description: 'Two tickets for the weekend concert. Seats together.',
    price: 60,
    status: 'available',
    created_at: '2024-01-02T19:05:00Z',
    images: [
      { id: 19, product_id: 18, image_url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[5], mockTags[9]],
    distance_km: 0.7,
  },
  {
    id: 19,
    seller_id: 1,
    seller: mockUsers[0],
    dormitory_id: 1,
    dormitory: mockDormitories[0],
    category_id: 1,
    category: mockCategories[0],
    condition_level_id: 3,
    condition_level: mockConditionLevels[2],
    title: 'Mechanical Keyboard',
    description: 'RGB mechanical keyboard, tactile switches. Used for a semester.',
    price: 45,
    status: 'available',
    created_at: '2024-01-02T11:35:00Z',
    images: [
      { id: 20, product_id: 19, image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[1], mockTags[7]],
    distance_km: 0.2,
  },
  {
    id: 20,
    seller_id: 2,
    seller: mockUsers[1],
    dormitory_id: 3,
    dormitory: mockDormitories[2],
    category_id: 9,
    category: mockCategories[8],
    condition_level_id: 2,
    condition_level: mockConditionLevels[1],
    title: 'Dorm Room LED Light Strips',
    description: 'Color-changing LEDs with remote. Easy to install and remove.',
    price: 12,
    status: 'available',
    created_at: '2024-01-01T15:55:00Z',
    images: [
      { id: 21, product_id: 20, image_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[4], mockTags[6]],
    distance_km: 1.5,
  },
  {
    id: 21,
    seller_id: 1,
    seller: mockUsers[0],
    dormitory_id: 1,
    dormitory: mockDormitories[0],
    category_id: 1,
    category: mockCategories[0],
    condition_level_id: 1,
    condition_level: mockConditionLevels[0],
    title: 'Wireless Gaming Mouse',
    description: 'Low-latency wireless mouse with charging dock. Great for gaming and study.',
    price: 42,
    status: 'available',
    created_at: '2023-12-30T14:40:00Z',
    images: [
      { id: 22, product_id: 21, image_url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[1], mockTags[7]],
    distance_km: 0.4,
  },
  {
    id: 22,
    seller_id: 2,
    seller: mockUsers[1],
    dormitory_id: 3,
    dormitory: mockDormitories[2],
    category_id: 2,
    category: mockCategories[1],
    condition_level_id: 2,
    condition_level: mockConditionLevels[1],
    title: 'Psychology 101 Notes',
    description: 'Printed notes and summaries for finals. Clean and well organized.',
    price: 15,
    status: 'available',
    created_at: '2023-12-29T09:15:00Z',
    images: [
      { id: 23, product_id: 22, image_url: 'https://images.unsplash.com/photo-1455885661740-29cbf08a42fa?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[0], mockTags[6]],
    distance_km: 1.2,
  },
  {
    id: 23,
    seller_id: 3,
    seller: mockUsers[2],
    dormitory_id: 2,
    dormitory: mockDormitories[1],
    category_id: 3,
    category: mockCategories[2],
    condition_level_id: 2,
    condition_level: mockConditionLevels[1],
    title: 'Rolling Storage Cart',
    description: 'Three-tier rolling cart for dorm storage. Smooth wheels.',
    price: 22,
    status: 'available',
    created_at: '2023-12-28T17:30:00Z',
    images: [
      { id: 24, product_id: 23, image_url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[3], mockTags[9]],
    distance_km: 0.9,
  },
  {
    id: 24,
    seller_id: 1,
    seller: mockUsers[0],
    dormitory_id: 1,
    dormitory: mockDormitories[0],
    category_id: 4,
    category: mockCategories[3],
    condition_level_id: 1,
    condition_level: mockConditionLevels[0],
    title: 'Winter Coat - Size L',
    description: 'Warm insulated coat, barely worn. Perfect for cold mornings.',
    price: 55,
    status: 'available',
    created_at: '2023-12-27T12:50:00Z',
    images: [
      { id: 25, product_id: 24, image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[4], mockTags[8]],
    distance_km: 0.3,
  },
  {
    id: 25,
    seller_id: 2,
    seller: mockUsers[1],
    dormitory_id: 3,
    dormitory: mockDormitories[2],
    category_id: 5,
    category: mockCategories[4],
    condition_level_id: 3,
    condition_level: mockConditionLevels[2],
    title: 'Tennis Racket Set',
    description: 'Two rackets and a set of balls. Great for campus courts.',
    price: 38,
    status: 'available',
    created_at: '2023-12-26T16:05:00Z',
    images: [
      { id: 26, product_id: 25, image_url: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[6], mockTags[9]],
    distance_km: 1.1,
  },
  {
    id: 26,
    seller_id: 3,
    seller: mockUsers[2],
    dormitory_id: 2,
    dormitory: mockDormitories[1],
    category_id: 6,
    category: mockCategories[5],
    condition_level_id: 2,
    condition_level: mockConditionLevels[1],
    title: 'Nonstick Pan Set',
    description: 'Two pans and spatula. Ideal for dorm cooking.',
    price: 24,
    status: 'available',
    created_at: '2023-12-25T10:20:00Z',
    images: [
      { id: 27, product_id: 26, image_url: 'https://images.unsplash.com/photo-1510627498534-cf7e9002facc?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[3], mockTags[8]],
    distance_km: 0.7,
  },
  {
    id: 27,
    seller_id: 1,
    seller: mockUsers[0],
    dormitory_id: 1,
    dormitory: mockDormitories[0],
    category_id: 7,
    category: mockCategories[6],
    condition_level_id: 1,
    condition_level: mockConditionLevels[0],
    title: 'Theater Tickets - Pair',
    description: 'Two tickets for the weekend show. Seats together.',
    price: 48,
    status: 'available',
    created_at: '2023-12-24T20:10:00Z',
    images: [
      { id: 28, product_id: 27, image_url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[5], mockTags[9]],
    distance_km: 0.5,
  },
  {
    id: 28,
    seller_id: 2,
    seller: mockUsers[1],
    dormitory_id: 3,
    dormitory: mockDormitories[2],
    category_id: 8,
    category: mockCategories[7],
    condition_level_id: 2,
    condition_level: mockConditionLevels[1],
    title: 'Skateboard Cruiser',
    description: 'Smooth ride skateboard, great for campus transport.',
    price: 70,
    status: 'available',
    created_at: '2023-12-23T11:45:00Z',
    images: [
      { id: 29, product_id: 28, image_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[6], mockTags[9]],
    distance_km: 1.0,
  },
  {
    id: 29,
    seller_id: 3,
    seller: mockUsers[2],
    dormitory_id: 2,
    dormitory: mockDormitories[1],
    category_id: 9,
    category: mockCategories[8],
    condition_level_id: 2,
    condition_level: mockConditionLevels[1],
    title: 'Desk Lamp with USB',
    description: 'LED desk lamp with USB charging port. Bright and compact.',
    price: 14,
    status: 'available',
    created_at: '2023-12-22T09:30:00Z',
    images: [
      { id: 30, product_id: 29, image_url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[3], mockTags[6]],
    distance_km: 1.6,
  },
  {
    id: 30,
    seller_id: 1,
    seller: mockUsers[0],
    dormitory_id: 1,
    dormitory: mockDormitories[0],
    category_id: 1,
    category: mockCategories[0],
    condition_level_id: 3,
    condition_level: mockConditionLevels[2],
    title: 'External SSD 1TB',
    description: 'Portable SSD, fast transfers for projects and backups.',
    price: 95,
    status: 'available',
    created_at: '2023-12-21T18:00:00Z',
    images: [
      { id: 31, product_id: 30, image_url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[1], mockTags[7]],
    distance_km: 0.2,
  },
  {
    id: 31,
    seller_id: 4,
    seller: mockUsers[3],
    dormitory_id: 6,
    dormitory: mockDormitories[5],
    category_id: 6,
    category: mockCategories[5],
    condition_level_id: 1,
    condition_level: mockConditionLevels[0],
    title: 'Electric Rice Cooker',
    description: 'Compact rice cooker, perfect for dorm meals. Includes steamer tray.',
    price: 28,
    status: 'available',
    created_at: '2024-01-18T09:10:00Z',
    images: [
      { id: 32, product_id: 31, image_url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[3], mockTags[8]],
    distance_km: 0.6,
  },
  {
    id: 32,
    seller_id: 4,
    seller: mockUsers[3],
    dormitory_id: 6,
    dormitory: mockDormitories[5],
    category_id: 1,
    category: mockCategories[0],
    condition_level_id: 2,
    condition_level: mockConditionLevels[1],
    title: 'Lenovo ThinkPad X1 Carbon',
    description: 'Lightweight laptop for study and coding. Battery still strong.',
    price: 520,
    status: 'available',
    created_at: '2024-01-17T16:45:00Z',
    images: [
      { id: 33, product_id: 32, image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[2], mockTags[7]],
    distance_km: 0.9,
  },
  {
    id: 33,
    seller_id: 5,
    seller: mockUsers[4],
    dormitory_id: 7,
    dormitory: mockDormitories[6],
    category_id: 4,
    category: mockCategories[3],
    condition_level_id: 1,
    condition_level: mockConditionLevels[0],
    title: 'Winter Parka - Size M',
    description: 'Warm Dalian winter coat, barely worn. Water-resistant.',
    price: 48,
    status: 'available',
    created_at: '2024-01-16T12:05:00Z',
    images: [
      { id: 34, product_id: 33, image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[4], mockTags[6]],
    distance_km: 1.3,
  },
  {
    id: 34,
    seller_id: 5,
    seller: mockUsers[4],
    dormitory_id: 7,
    dormitory: mockDormitories[6],
    category_id: 2,
    category: mockCategories[1],
    condition_level_id: 2,
    condition_level: mockConditionLevels[1],
    title: 'Mandarin Study Set',
    description: 'Textbooks, flashcards, and practice sheets. Great for beginners.',
    price: 22,
    status: 'available',
    created_at: '2024-01-15T11:20:00Z',
    images: [
      { id: 35, product_id: 34, image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[0], mockTags[6]],
    distance_km: 1.1,
  },
  {
    id: 35,
    seller_id: 4,
    seller: mockUsers[3],
    dormitory_id: 6,
    dormitory: mockDormitories[5],
    category_id: 8,
    category: mockCategories[7],
    condition_level_id: 2,
    condition_level: mockConditionLevels[1],
    title: 'City Commuter Bicycle',
    description: 'Smooth ride for campus and city. Recently tuned and cleaned.',
    price: 85,
    status: 'available',
    created_at: '2024-01-14T18:30:00Z',
    images: [
      { id: 36, product_id: 35, image_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[6], mockTags[9]],
    distance_km: 0.7,
  },
  {
    id: 36,
    seller_id: 5,
    seller: mockUsers[4],
    dormitory_id: 7,
    dormitory: mockDormitories[6],
    category_id: 5,
    category: mockCategories[4],
    condition_level_id: 1,
    condition_level: mockConditionLevels[0],
    title: 'Badminton Set',
    description: 'Two rackets and shuttlecocks. Great for campus courts.',
    price: 18,
    status: 'available',
    created_at: '2024-01-13T09:35:00Z',
    images: [
      { id: 37, product_id: 36, image_url: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=600&h=400&fit=crop', is_primary: true },
    ],
    tags: [mockTags[6], mockTags[8]],
    distance_km: 1.0,
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

export const formatPrice = (price: number, currency?: string): string => {
  const normalizedCurrency = typeof currency === 'string' ? currency.trim() : '';
  const normalizedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  if (normalizedCurrency.toUpperCase() === 'CNY') {
    return `${normalizedNumber} ¥`;
  }

  if (/^[a-z]{3}$/i.test(normalizedCurrency)) {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: normalizedCurrency.toUpperCase(),
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    } catch {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    }
  }

  if (normalizedCurrency.length > 0) {
    if (normalizedCurrency === '¥' || normalizedCurrency === '￥') {
      return `${normalizedNumber} ¥`;
    }
    return `${normalizedCurrency}${normalizedNumber}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};
