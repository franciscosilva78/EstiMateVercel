export interface User {
  id: string;
  name: string;
  role: string;
  vote: number | null;
}

export interface RoomState {
  id: string;
  name: string;
  status: "voting" | "revealed";
  calculationMethod: "average" | "sumByRole" | "mostVotedOverall";
  manualModeSelections: Record<string, number>; // e.g., { "QA": 1.0, "Dev": 2.0 }
  users: Record<string, User>;
  theme?: "default" | "cyberpunk" | "matrix" | "ocean";
}
