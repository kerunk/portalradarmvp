import { useAuth } from "@/contexts/AuthContext";
import { useReadOnly } from "@/contexts/ReadOnlyContext";

/**
 * Returns the company ID that should drive the current view.
 * - When the Admin Master is in mirror mode, returns mirrorCompanyId.
 * - Otherwise, returns the authenticated user's own companyId.
 */
export function useActiveCompanyId(): string {
  const { user } = useAuth();
  const { mirrorCompanyId } = useReadOnly();
  return mirrorCompanyId || user?.companyId || "";
}