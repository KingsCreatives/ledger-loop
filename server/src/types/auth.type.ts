export type PublicUser = {
  id: string;
  email: string;
};

export type AuthUser = PublicUser & {
  password: string;
};
