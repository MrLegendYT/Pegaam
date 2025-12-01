export interface UserProfile {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
}

export interface Room {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
  joiners: string[]; // List of user UIDs
  joinerCount: number;
}

export interface Message {
  id?: string;
  text: string;
  imageUrl?: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  timestamp: number;
  type: 'text' | 'image' | 'system';
}

export interface ImgBBResponse {
  data: {
    url: string;
    display_url: string;
  };
  success: boolean;
  status: number;
}
