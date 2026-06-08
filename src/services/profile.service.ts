import api from "@/lib/api";
import { FriendProfile } from "./friends.service";

export interface UserSettings {
  user_id: number;
  email_notifications_enabled: boolean;
}

export interface UserProfileData {
  id: number;
  email: string;
  username: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
  settings?: UserSettings;
}

export interface ProfileResponse {
  success: boolean;
  data: UserProfileData;
}

export interface UpdateProfileInput {
  username?: string;
  emailNotificationsEnabled?: boolean;
}

export interface Profile {
  id: number;
  email: string;
  username: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
  joinedAt: string; // Backward compatibility mapper fallback
  settings?: UserSettings;
}

export const profileService = {
  /**
   * GET /profile/me
   * Fetches the current logged-in user's profile configuration
   */
  async me(): Promise<Profile> {
    const res = await api.get<ProfileResponse>("/profile/me");
    
    // Explicitly unwrap and fallback to an empty or partial record typed as any if needed,
    // or pull directly from data to guarantee the UserProfileData type structure.
    const profileData = (res.data?.data || res.data) as any;
    
    return {
      ...profileData,
      // Fallback fallback consistency for rendering logic
      created_at: profileData?.created_at || new Date().toISOString(),
      joinedAt: profileData?.created_at || new Date().toISOString()
    };
  },

  /**
   * PUT /profile/me
   * Updates username or notification preferences
   */
  async update(input: UpdateProfileInput): Promise<Profile> {
    const res = await api.put<any>("/profile/me", input);
    
    // Normalizes variation inside update responses (user vs data containers) safely
    const rawData = res.data?.data || res.data;
    const userCore = rawData?.user || rawData;
    const settingsCore = rawData?.settings;

    return {
      ...userCore,
      settings: settingsCore,
      created_at: userCore?.created_at || new Date().toISOString(),
      joinedAt: userCore?.created_at || new Date().toISOString()
    };
  },

  /**
   * POST /profile/avatar
   * Uploads raw binary imagery payloads using FormData
   */
  async uploadAvatar(file: File): Promise<{ success: boolean; avatarUrl: string }> {
    const formData = new FormData();
    formData.append("avatar", file);

    const res = await api.post("/profile/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data?.data || res.data;
  },

  /**
   * DELETE /profile/me
   * Completely terminates and cleans up user account records
   */
  async deleteAccount(): Promise<{ success: boolean }> {
    const res = await api.delete("/profile/me");
    return res.data;
  },

  /**
   * GET /profile/{userId}
   * Returns generic profile summaries for any system user
   */
  async getPublicProfile(userId: number | string): Promise<FriendProfile> {
    const res = await api.get(`/profile/${userId}`);
    return res.data?.data || res.data;
  }
};