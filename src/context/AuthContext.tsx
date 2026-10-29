import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { StorageService } from '../lib/storage';

interface AuthContextType {
  user: UserProfile;
  role: UserRole;
  isStudent: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  switchRole: (role: UserRole) => void;
  login: (email: string, role?: UserRole) => boolean;
  register: (data: { fullName: string; email: string; studentId: string; phone: string }) => boolean;
  logout: () => void;
  allUsers: UserProfile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => StorageService.getActiveUser());
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => StorageService.getUsers());

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(StorageService.getActiveUser());
      setAllUsers(StorageService.getUsers());
    };
    window.addEventListener('campusbite_storage_sync', handleStorageChange);
    return () => window.removeEventListener('campusbite_storage_sync', handleStorageChange);
  }, []);

  const switchRole = (newRole: UserRole) => {
    const matched = allUsers.find((u) => u.role === newRole);
    if (matched) {
      StorageService.setActiveUser(matched);
      setUser(matched);
    } else {
      // Create quick user for that role
      const newUser: UserProfile = {
        id: `${newRole.slice(0, 3)}-${Date.now()}`,
        fullName: newRole === 'admin' ? 'Canteen Administrator' : newRole === 'staff' ? 'Kitchen Lead' : 'Campus Student',
        email: `${newRole}@campus.edu`,
        role: newRole,
        createdAt: new Date().toISOString(),
      };
      StorageService.registerUser(newUser);
      setUser(newUser);
    }
  };

  const login = (email: string, targetRole: UserRole = 'student'): boolean => {
    const existing = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      StorageService.setActiveUser(existing);
      setUser(existing);
      return true;
    }
    // Auto-create student
    const created: UserProfile = {
      id: `usr-${Date.now()}`,
      fullName: email.split('@')[0].replace('.', ' '),
      email,
      role: targetRole,
      createdAt: new Date().toISOString(),
    };
    StorageService.registerUser(created);
    setUser(created);
    return true;
  };

  const register = (data: { fullName: string; email: string; studentId: string; phone: string }): boolean => {
    const created: UserProfile = {
      id: `std-${Date.now()}`,
      fullName: data.fullName,
      email: data.email,
      studentId: data.studentId,
      phone: data.phone,
      role: 'student',
      createdAt: new Date().toISOString(),
    };
    StorageService.registerUser(created);
    setUser(created);
    return true;
  };

  const logout = () => {
    const students = allUsers.filter((u) => u.role === 'student');
    const defaultStudent = students[0] || allUsers[0];
    StorageService.setActiveUser(defaultStudent);
    setUser(defaultStudent);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user.role,
        isStudent: user.role === 'student',
        isStaff: user.role === 'staff',
        isAdmin: user.role === 'admin',
        switchRole,
        login,
        register,
        logout,
        allUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
