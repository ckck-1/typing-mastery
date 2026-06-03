// Custom Express namespace augmentation declaration
import { UserPayload } from './auth'; // adjust path to where your JWT payload type is defined

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email?: string;
        // any other specific session properties
      };
    }
  }
}