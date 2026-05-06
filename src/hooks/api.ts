import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { passagesService, type Passage } from "@/services/passages.service";
import { sessionsService, type CreateSessionInput } from "@/services/sessions.service";
import { leaderboardService, type LeaderboardScope } from "@/services/leaderboard.service";
import { lessonsService } from "@/services/lessons.service";
import { profileService, type Profile } from "@/services/profile.service";

export const usePassages = () =>
  useQuery({ queryKey: ["passages"], queryFn: passagesService.list });

export const useRandomPassage = (category?: Passage["category"]) =>
  useQuery({
    queryKey: ["passages", "random", category ?? "any"],
    queryFn: () => passagesService.random(category),
    staleTime: 0,
  });

export const useSessions = (limit = 20) =>
  useQuery({ queryKey: ["sessions", limit], queryFn: () => sessionsService.list(limit) });

export const useSessionStats = () =>
  useQuery({ queryKey: ["sessions", "stats"], queryFn: sessionsService.stats });

export const useCreateSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSessionInput) => sessionsService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useLeaderboard = (scope: LeaderboardScope) =>
  useQuery({
    queryKey: ["leaderboard", scope],
    queryFn: () => leaderboardService.list(scope),
  });

export const useLessons = () =>
  useQuery({ queryKey: ["lessons"], queryFn: lessonsService.list });

export const useProfile = () =>
  useQuery({ queryKey: ["profile"], queryFn: profileService.me });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Pick<Profile, "name" | "username">>) =>
      profileService.update(patch),
    onSuccess: (data) => qc.setQueryData(["profile"], data),
  });
};
