import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { passagesService, type Passage } from "@/services/passages.service";
import { progressionService, type Progression } from "@/services/progression.service";
import { lessonsService, type Lesson } from "@/services/lessons.service";
import { profileService, type Profile } from "@/services/profile.service";

// Export base types for components to use
export type { Lesson, Passage };

// Define the missing Scope type directly here so it's globally available
export type LeaderboardScope = "worldwide" | "friends";

export interface TestResultInput {
  wpm: number;
  accuracy: number;
  duration: number; 
  mode: string;
  passageId: number | string;
}

export interface TestResult {
  id: number;
  userId: number;
  wpm: string;
  accuracy: string;
  duration: number;
  mode: string;
  passageId: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  id: number;
  username: string;
  wpm: string | number;
  accuracy: string | number;
  mode: string;
  createdAt: string;
}

// 1. Hook to fetch a random practice passage using the unwrapped service layer
export const useTestPassage = (mode: "quote" | "custom" | "lesson" = "quote") =>
  useQuery<Passage, Error>({
    queryKey: ["tests", "passage", mode],
    queryFn: () => passagesService.random(mode),
    staleTime: 0,
  });

// 2. Hook to save test results and increment local storage tracking telemetry
export const useSaveTestResult = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (result: TestResultInput) => {
      // Post result to the backend
      const response = await api.post("/tests/result", result);

      // Distribute regional local storage XP points
      const estimatedWords = Math.round(result.wpm * (result.duration / 60));
      const calculatedXp = Math.round((result.wpm * (result.accuracy / 100)) * 0.5);

      await progressionService.award({
        xp: Math.max(5, calculatedXp), 
        words: estimatedWords || 1,
      });

      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tests", "results"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["progression"] });
    },
  });
};

// 3. Hook to pull user record histories with complete data un-wrapping safely
export const useTestHistory = () =>
  useQuery<TestResult[], Error>({
    queryKey: ["tests", "results"],
    queryFn: async () => {
      const res = await api.get("/tests/results");
      const list = res.data?.data ? res.data.data : res.data;
      
      // Remap backend properties to cleanly accommodate snake_case to camelCase transformations
      return (Array.isArray(list) ? list : []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        wpm: item.wpm,
        accuracy: item.accuracy,
        duration: item.duration,
        mode: item.mode,
        passageId: item.passage_id,
        createdAt: item.created_at,
      }));
    },
  });

export const useUserProgression = () =>
  useQuery<Progression, Error>({
    queryKey: ["progression"],
    queryFn: () => progressionService.get(),
  });

export const useRandomPassage = (mode?: "quote" | "custom" | "lesson") =>
  useQuery({
    queryKey: ["passage", "random", mode ?? "any"],
    queryFn: () => passagesService.random(mode),
    staleTime: 0,
  });

export const useLessons = () =>
  useQuery<any, Error, Lesson[]>({ 
    queryKey: ["lessons"], 
    queryFn: () => lessonsService.list(),
    select: (rawResponse) => {
      const target = rawResponse?.data ? rawResponse.data : rawResponse;
      return Array.isArray(target) ? target : [];
    }
  });

export const useProfile = () =>
  useQuery({ queryKey: ["profile"], queryFn: () => profileService.me() });

// 4. Hook to fetch the leaderboard rankings based on global or friend scope parameters
export const useLeaderboard = (scope: LeaderboardScope = "worldwide") =>
  useQuery<LeaderboardEntry[], Error>({
    queryKey: ["leaderboard", scope],
    queryFn: async () => {
      const res = await api.get("/tests/results");
      const list = res.data?.data ? res.data.data : res.data;
      
      return (Array.isArray(list) ? list : [])
        .map((item: any) => ({
          id: item.id,
          username: item.user?.username ?? item.username ?? "Anonymous",
          wpm: item.wpm,
          accuracy: item.accuracy,
          mode: item.mode ?? "time",
          createdAt: item.created_at ?? item.createdAt,
        }))
        // Ensure scores are sorted descending
        .sort((a, b) => parseFloat(b.wpm as string) - parseFloat(a.wpm as string));
    },
  });