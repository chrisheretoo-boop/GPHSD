export interface Business {
  id: string;
  business: string;
  category: string;
  description: string;
  price: string;
  location: string;
  hours: string;
  payment: string;
  owner: string;
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
}

export interface Review {
  name: string;
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
  role: 'admin' | 'business';
  email?: string;
  created?: number;
}

export type ViewState = 'home' | 'admin' | 'profile' | 'owner';