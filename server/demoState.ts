// Shared user state to avoid circular imports
let userAuthenticated = false;
let userTermsAcceptedAt: Date | null = null;
let currentUser: any = null;
let allUsers: any[] = []; // Store all created users

export function getUserAuthenticated(): boolean {
  return userAuthenticated;
}

export function setUserAuthenticated(accepted: boolean, user?: any, acceptedAt?: Date): void {
  userAuthenticated = accepted;
  currentUser = user || null;
  userTermsAcceptedAt = acceptedAt || (accepted ? new Date() : null);
}

export function resetUserState(): void {
  userAuthenticated = false;
  userTermsAcceptedAt = null;
  currentUser = null;
}

export function getCurrentUser(): any {
  return currentUser;
}

export function getUserTermsAcceptedAt(): Date | null {
  return userTermsAcceptedAt;
}

export function addUser(user: any): void {
  allUsers.push(user);
}

export function findUserByEmail(email: string): any {
  return allUsers.find(user => user.email === email);
}

export function getAllUsers(): any[] {
  return allUsers;
}