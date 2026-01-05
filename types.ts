export interface Business {
  id: string;
  business: string;
  category: string;
  description: string;
  price: string;
  location: string;
  hours: string;
  payment: string;
  owner: string; // The username (ID)
  ownerName: string;
  ownerPos: string;
  ownerContact: string;
  ownerBio: string;
  ownerImg?: string;
  images: string[];
  imageURL?: string;
  logo?: string;
  status: 'approved' | 'pending' | 'pending_payment';
  subscriptionEnd: number;
  weeklyViews: number;
  views: number;
  social: string;
  reviews: Review[];
  featured?: boolean;
  order?: number;
  verified?: boolean;
}

export interface Review {
  name: string; // The username of the reviewer
  displayName?: string; // Optional cached name
  photoURL?: string; // Optional cached photo
  rating: number;
  text: string;
  date: number;
}

export interface SupportTicket {
  id: string;
  category: string;
  name: string;
  email: string;
  message: string;
  status: 'open' | 'closed';
  date: number;
  reply?: string;
  replyDate?: number;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'business' | 'moderator';
  email?: string;
  displayName?: string;
  bio?: string;
  profileImg?: string;
  contactInfo?: string;
  created?: number;
  password?: string;
  source?: 'users' | 'applications';
}

export type ViewState = 'home' | 'admin' | 'profile' | 'owner';