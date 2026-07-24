// src/lib/roleLabels.ts — traducción de roles a labels visibles
import type { TenantRole } from '@/types';

export const TENANT_ROLE_LABELS: Record<TenantRole, string> = {
  tenant_owner: 'Dueño',
  tenant_admin: 'Administrador',
  tenant_manager: 'Gerente',
  tenant_user: 'Vendedor',
  tenant_cajero: 'Cajero',
};

export function labelForRole(role: TenantRole | null | undefined): string {
  if (!role) return 'Usuario';
  return TENANT_ROLE_LABELS[role] ?? role;
}
