import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyRoles } from "@/lib/roles.functions";
import { supabase } from "@/integrations/supabase/client";
import type { Permission } from "@/lib/rbac/permissions";

export type MyAccess = {
  userId: string;
  roles: string[];
  permissions: Permission[];
  isAdmin: boolean;
  isEditor: boolean;
};

/** Có phiên đăng nhập hay chưa (chỉ chạy phía trình duyệt). */
function useHasSession() {
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setHasSession(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setHasSession(!!session);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return hasSession;
}

/** Lấy vai trò + quyền của tài khoản đang đăng nhập (cache chung cho toàn app). */
export function useMyAccess() {
  const fetchRoles = useServerFn(getMyRoles);
  const hasSession = useHasSession();
  const query = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => fetchRoles() as Promise<MyAccess>,
    staleTime: 60_000,
    enabled: hasSession === true,
    retry: false,
  });

  const access = query.data;
  const can = (permission: Permission) => !!access?.permissions?.includes(permission);
  const canAny = (...list: Permission[]) => list.some(can);

  return {
    ...query,
    isLoading: hasSession === null || (hasSession && query.isLoading),
    access,
    can,
    canAny,
  };
}


/** Ẩn/hiện UI theo quyền. */
export function Can({
  permission,
  any,
  children,
  fallback = null,
}: {
  permission?: Permission;
  any?: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { can, canAny, isLoading } = useMyAccess();
  if (isLoading) return null;
  const allowed = permission ? can(permission) : any ? canAny(...any) : false;
  return <>{allowed ? children : fallback}</>;
}
