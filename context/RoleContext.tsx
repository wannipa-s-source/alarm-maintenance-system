'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'Admin' | 'Operator' | 'Viewer';

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('Admin');

  const canEdit = role === 'Admin' || role === 'Operator';
  const canDelete = role === 'Admin';

  return (
    <RoleContext.Provider value={{ role, setRole, canEdit, canDelete }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}