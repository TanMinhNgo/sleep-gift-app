export type Role = 'sleeper' | 'partner';
export type Me = {
  role: Role;
  name: string;
  sharing_enabled: boolean;
  other: { name: string; sharing_enabled: boolean } | null;
};
export type RegisterRes = { token: string; inviteCode: string };
export type JoinRes = { token: string; partnerName: string };
export type InviteRes = { inviteCode: string };
export type Log = {
  date: string;
  bed_time: string;
  wake_time: string;
  latency_min: number;
  awakenings: number;
  awake_min: number;
  rating: number;
  note: string | null;
  updated_at: string;
};
export type Note = {
  id: string;
  kind: 'goodnight' | 'scene' | 'word';
  text: string;
  show_on_date: string | null;
  created_at?: string;
};
