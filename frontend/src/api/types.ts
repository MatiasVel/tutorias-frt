export type Role = 'STUDENT' | 'PROFESSOR' | 'ADMIN';
export type Modality = 'PRESENCIAL' | 'VIRTUAL' | 'AMBAS';
export type OfferingStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAUSED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
export type ReviewDirection = 'STUDENT_TO_TUTOR' | 'TUTOR_TO_STUDENT';

export interface Career {
  id: number;
  name: string;
  code: string;
}

export interface Subject {
  id: number;
  name: string;
  code?: string;
  year: number;
}

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  bio?: string | null;
  role: Role;
  tutorRatingAvg: number;
  tutorRatingCount: number;
  studentRatingAvg: number;
  studentRatingCount: number;
  career?: { id: number; name: string } | null;
}

export interface Me extends PublicUser {
  email: string;
  phone?: string | null;
  legajo?: string | null;
}

export interface Offering {
  id: string;
  pricePerHour: string;
  modality: Modality;
  description: string;
  finalGrade: number;
  approvedAt: string;
  subject: Subject;
  tutor: PublicUser;
}

export interface MyOffering extends Omit<Offering, 'tutor'> {
  status: OfferingStatus;
  reviewNote?: string | null;
  _count: { bookings: number };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ContactUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string | null;
  tutorRatingAvg: number;
  tutorRatingCount: number;
  studentRatingAvg: number;
  studentRatingCount: number;
}

export interface Booking {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  priceAgreed: string;
  message?: string | null;
  status: BookingStatus;
  offering: {
    id: string;
    modality: Modality;
    subject: { id: number; name: string };
    tutor: ContactUser;
  };
  student: ContactUser;
  myReview: { rating: number; comment?: string | null } | null;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  direction: ReviewDirection;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string };
}

export interface PublicProfile extends PublicUser {
  createdAt: string;
  offerings: { id: string; pricePerHour: string; modality: Modality; finalGrade: number; subject: Subject }[];
  reviewsReceived: Review[];
}
