export type CurrentUser = {
  userId: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
};
