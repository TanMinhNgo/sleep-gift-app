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
