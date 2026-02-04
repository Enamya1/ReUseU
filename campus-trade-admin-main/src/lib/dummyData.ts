// Dummy data for the admin dashboard

export interface University {
  id: string;
  name: string;
  location: string;
  studentCount: number;
  dormitoriesCount: number;
  createdAt: string;
  lat: number;
  lng: number;
  description?: string;
  website?: string;
  foundedYear?: number;
}

export interface Dormitory {
  id: string;
  name: string;
  universityId: string;
  universityName: string;
  capacity: number;
  occupancy: number;
  address: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
  icon: string;
  createdAt: string;
}

export interface Condition {
  id: string;
  name: string;
  description: string;
  level: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  username: string;
  studentId: string;
  dateOfBirth: string;
  gender: string;
  language: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  universityId: string;
  universityName: string;
  dormitoryId: string;
  dormitoryName: string;
  phone: string;
  avatar: string;
  createdAt: string;
  lastLogin: string;
  productsListed: number;
  productsSold: number;
}

export const universities: University[] = [
  { id: '1', name: 'MIT', location: 'Cambridge, MA', studentCount: 11520, dormitoriesCount: 12, createdAt: '2024-01-15', lat: 42.3601, lng: -71.0942, description: 'Massachusetts Institute of Technology is a private research university known for its strong engineering and computer science programs.', website: 'https://www.mit.edu', foundedYear: 1861 },
  { id: '2', name: 'Stanford University', location: 'Stanford, CA', studentCount: 17249, dormitoriesCount: 18, createdAt: '2024-01-18', lat: 37.4275, lng: -122.1697, description: 'Stanford University is a private research university known for its academic strength, wealth, and proximity to Silicon Valley.', website: 'https://www.stanford.edu', foundedYear: 1885 },
  { id: '3', name: 'Harvard University', location: 'Cambridge, MA', studentCount: 21000, dormitoriesCount: 15, createdAt: '2024-02-01', lat: 42.3770, lng: -71.1167, description: 'Harvard University is the oldest institution of higher education in the United States and one of the most prestigious in the world.', website: 'https://www.harvard.edu', foundedYear: 1636 },
  { id: '4', name: 'Yale University', location: 'New Haven, CT', studentCount: 14500, dormitoriesCount: 14, createdAt: '2024-02-10', lat: 41.3163, lng: -72.9223, description: 'Yale University is a private Ivy League research university known for its excellent law and drama schools.', website: 'https://www.yale.edu', foundedYear: 1701 },
  { id: '5', name: 'Princeton University', location: 'Princeton, NJ', studentCount: 8500, dormitoriesCount: 8, createdAt: '2024-02-15', lat: 40.3431, lng: -74.6551, description: 'Princeton University is a private Ivy League research university known for its beautiful campus and undergraduate focus.', website: 'https://www.princeton.edu', foundedYear: 1746 },
  { id: '6', name: 'Columbia University', location: 'New York, NY', studentCount: 32400, dormitoriesCount: 22, createdAt: '2024-03-01', lat: 40.8075, lng: -73.9626, description: 'Columbia University is a private Ivy League research university in New York City, known for its journalism and business schools.', website: 'https://www.columbia.edu', foundedYear: 1754 },
];

export const dormitories: Dormitory[] = [
  { id: '1', name: 'Baker House', universityId: '1', universityName: 'MIT', capacity: 350, occupancy: 320, address: '362 Memorial Dr', createdAt: '2024-01-20' },
  { id: '2', name: 'MacGregor House', universityId: '1', universityName: 'MIT', capacity: 310, occupancy: 290, address: '450 Memorial Dr', createdAt: '2024-01-20' },
  { id: '3', name: 'Simmons Hall', universityId: '1', universityName: 'MIT', capacity: 340, occupancy: 335, address: '229 Vassar St', createdAt: '2024-01-25' },
  { id: '4', name: 'Roble Hall', universityId: '2', universityName: 'Stanford University', capacity: 290, occupancy: 280, address: '580 Lomita Dr', createdAt: '2024-01-22' },
  { id: '5', name: 'Stern Hall', universityId: '2', universityName: 'Stanford University', capacity: 400, occupancy: 385, address: '589 Capistrano Way', createdAt: '2024-01-28' },
  { id: '6', name: 'Adams House', universityId: '3', universityName: 'Harvard University', capacity: 450, occupancy: 420, address: '26 Plympton St', createdAt: '2024-02-05' },
  { id: '7', name: 'Leverett House', universityId: '3', universityName: 'Harvard University', capacity: 480, occupancy: 450, address: '28 DeWolfe St', createdAt: '2024-02-08' },
  { id: '8', name: 'Berkeley College', universityId: '4', universityName: 'Yale University', capacity: 420, occupancy: 400, address: '205 Elm St', createdAt: '2024-02-12' },
];

export const categories: Category[] = [
  { id: '1', name: 'Electronics', description: 'Laptops, phones, tablets, and accessories', productCount: 1245, icon: 'Laptop', createdAt: '2024-01-10' },
  { id: '2', name: 'Textbooks', description: 'Course materials and educational books', productCount: 3420, icon: 'Book', createdAt: '2024-01-10' },
  { id: '3', name: 'Furniture', description: 'Desks, chairs, beds, and storage', productCount: 890, icon: 'Armchair', createdAt: '2024-01-10' },
  { id: '4', name: 'Clothing', description: 'Apparel and accessories', productCount: 2150, icon: 'Shirt', createdAt: '2024-01-10' },
  { id: '5', name: 'Sports', description: 'Sports equipment and gear', productCount: 567, icon: 'Dumbbell', createdAt: '2024-01-12' },
  { id: '6', name: 'Kitchen', description: 'Appliances and utensils', productCount: 432, icon: 'ChefHat', createdAt: '2024-01-15' },
  { id: '7', name: 'Entertainment', description: 'Games, music, and movies', productCount: 789, icon: 'Gamepad2', createdAt: '2024-01-18' },
  { id: '8', name: 'Transportation', description: 'Bikes, scooters, and accessories', productCount: 234, icon: 'Bike', createdAt: '2024-02-01' },
];

export const conditions: Condition[] = [
  { id: '1', name: 'Like New', description: 'Item is in perfect condition with no visible wear', level: 5, createdAt: '2024-01-10' },
  { id: '2', name: 'Excellent', description: 'Minimal signs of use, fully functional', level: 4, createdAt: '2024-01-10' },
  { id: '3', name: 'Good', description: 'Some wear and tear but works perfectly', level: 3, createdAt: '2024-01-10' },
  { id: '4', name: 'Fair', description: 'Visible wear but still functional', level: 2, createdAt: '2024-01-10' },
  { id: '5', name: 'Poor', description: 'Heavy wear, may need repairs', level: 1, createdAt: '2024-01-10' },
];

export const users: User[] = [
  { id: '1', email: 'john.doe@mit.edu', emailVerified: true, name: 'John Doe', username: 'john.doe', studentId: 'MIT-2024-0001', dateOfBirth: '2002-04-12', gender: 'Male', language: 'English', role: 'admin', status: 'active', universityId: '1', universityName: 'MIT', dormitoryId: '1', dormitoryName: 'Baker House', phone: '+1 617-555-0101', avatar: '', createdAt: '2024-01-15', lastLogin: '2024-12-01', productsListed: 15, productsSold: 8 },
  { id: '2', email: 'jane.smith@stanford.edu', emailVerified: true, name: 'Jane Smith', username: 'jane.smith', studentId: 'SU-2024-0002', dateOfBirth: '2001-09-05', gender: 'Female', language: 'English', role: 'moderator', status: 'active', universityId: '2', universityName: 'Stanford University', dormitoryId: '4', dormitoryName: 'Roble Hall', phone: '+1 650-555-0102', avatar: '', createdAt: '2024-01-20', lastLogin: '2024-11-28', productsListed: 32, productsSold: 24 },
  { id: '3', email: 'mike.johnson@harvard.edu', emailVerified: false, name: 'Mike Johnson', username: 'mike.johnson', studentId: 'HU-2024-0003', dateOfBirth: '2000-12-21', gender: 'Male', language: 'English', role: 'user', status: 'active', universityId: '3', universityName: 'Harvard University', dormitoryId: '6', dormitoryName: 'Adams House', phone: '+1 617-555-0103', avatar: '', createdAt: '2024-02-01', lastLogin: '2024-11-30', productsListed: 8, productsSold: 5 },
  { id: '4', email: 'sarah.williams@yale.edu', emailVerified: false, name: 'Sarah Williams', username: 'sarah.williams', studentId: 'YU-2024-0004', dateOfBirth: '2002-02-14', gender: 'Female', language: 'English', role: 'user', status: 'inactive', universityId: '4', universityName: 'Yale University', dormitoryId: '8', dormitoryName: 'Berkeley College', phone: '+1 203-555-0104', avatar: '', createdAt: '2024-02-15', lastLogin: '2024-10-15', productsListed: 3, productsSold: 1 },
  { id: '5', email: 'david.brown@mit.edu', emailVerified: true, name: 'David Brown', username: 'david.brown', studentId: 'MIT-2024-0005', dateOfBirth: '2001-06-30', gender: 'Male', language: 'English', role: 'user', status: 'active', universityId: '1', universityName: 'MIT', dormitoryId: '2', dormitoryName: 'MacGregor House', phone: '+1 617-555-0105', avatar: '', createdAt: '2024-03-01', lastLogin: '2024-12-01', productsListed: 45, productsSold: 38 },
  { id: '6', email: 'emma.davis@stanford.edu', emailVerified: false, name: 'Emma Davis', username: 'emma.davis', studentId: 'SU-2024-0006', dateOfBirth: '2002-11-08', gender: 'Female', language: 'English', role: 'user', status: 'suspended', universityId: '2', universityName: 'Stanford University', dormitoryId: '5', dormitoryName: 'Stern Hall', phone: '+1 650-555-0106', avatar: '', createdAt: '2024-03-10', lastLogin: '2024-09-20', productsListed: 12, productsSold: 0 },
  { id: '7', email: 'chris.miller@harvard.edu', emailVerified: true, name: 'Chris Miller', username: 'chris.miller', studentId: 'HU-2024-0007', dateOfBirth: '2000-05-19', gender: 'Male', language: 'English', role: 'user', status: 'active', universityId: '3', universityName: 'Harvard University', dormitoryId: '7', dormitoryName: 'Leverett House', phone: '+1 617-555-0107', avatar: '', createdAt: '2024-03-15', lastLogin: '2024-11-29', productsListed: 22, productsSold: 18 },
  { id: '8', email: 'olivia.wilson@mit.edu', emailVerified: true, name: 'Olivia Wilson', username: 'olivia.wilson', studentId: 'MIT-2024-0008', dateOfBirth: '2001-03-03', gender: 'Female', language: 'English', role: 'moderator', status: 'active', universityId: '1', universityName: 'MIT', dormitoryId: '3', dormitoryName: 'Simmons Hall', phone: '+1 617-555-0108', avatar: '', createdAt: '2024-04-01', lastLogin: '2024-12-01', productsListed: 28, productsSold: 21 },
  { id: '9', email: 'james.taylor@yale.edu', emailVerified: true, name: 'James Taylor', username: 'james.taylor', studentId: 'YU-2024-0009', dateOfBirth: '2001-01-25', gender: 'Male', language: 'English', role: 'user', status: 'active', universityId: '4', universityName: 'Yale University', dormitoryId: '8', dormitoryName: 'Berkeley College', phone: '+1 203-555-0109', avatar: '', createdAt: '2024-04-15', lastLogin: '2024-11-25', productsListed: 6, productsSold: 4 },
  { id: '10', email: 'sophia.anderson@stanford.edu', emailVerified: true, name: 'Sophia Anderson', username: 'sophia.anderson', studentId: 'SU-2024-0010', dateOfBirth: '2002-07-17', gender: 'Female', language: 'English', role: 'user', status: 'active', universityId: '2', universityName: 'Stanford University', dormitoryId: '4', dormitoryName: 'Roble Hall', phone: '+1 650-555-0110', avatar: '', createdAt: '2024-05-01', lastLogin: '2024-11-30', productsListed: 19, productsSold: 14 },
  { id: '11', email: 'liam.thomas@mit.edu', emailVerified: false, name: 'Liam Thomas', username: 'liam.thomas', studentId: 'MIT-2024-0011', dateOfBirth: '2000-10-10', gender: 'Male', language: 'English', role: 'user', status: 'active', universityId: '1', universityName: 'MIT', dormitoryId: '1', dormitoryName: 'Baker House', phone: '+1 617-555-0111', avatar: '', createdAt: '2024-05-10', lastLogin: '2024-12-01', productsListed: 11, productsSold: 9 },
  { id: '12', email: 'ava.jackson@harvard.edu', emailVerified: false, name: 'Ava Jackson', username: 'ava.jackson', studentId: 'HU-2024-0012', dateOfBirth: '2003-02-02', gender: 'Female', language: 'English', role: 'user', status: 'inactive', universityId: '3', universityName: 'Harvard University', dormitoryId: '6', dormitoryName: 'Adams House', phone: '+1 617-555-0112', avatar: '', createdAt: '2024-05-20', lastLogin: '2024-08-10', productsListed: 2, productsSold: 0 },
];

export const dashboardStats = {
  totalUsers: 12450,
  activeUsers: 9823,
  totalProducts: 34520,
  totalTransactions: 8945,
  monthlyRevenue: 125430,
  growthRate: 12.5,
  newUsersThisMonth: 234,
  pendingReports: 18,
};
