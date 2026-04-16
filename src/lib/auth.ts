import { isRedirect, redirect } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  getUser: () => Promise<User | null>;
  signOut: () => Promise<void>;
};

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user ?? null;
}

export async function requireAuthenticatedUser(
  auth: Pick<AuthContextValue, "user" | "getUser">,
  redirectTo: string,
) {
  try {
    const user = auth.user ?? (await auth.getUser());

    if (!user) {
      throw redirect({
        to: "/login",
        search: {
          redirect: getSafeRedirectPath(redirectTo),
        },
      });
    }

    return user;
  } catch (error) {
    if (isRedirect(error)) {
      throw error;
    }

    throw redirect({
      to: "/login",
      search: {
        redirect: getSafeRedirectPath(redirectTo),
      },
    });
  }
}

export function getSafeRedirectPath(redirectTo?: string) {
  if (!redirectTo || !redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return "/";
  }

  return redirectTo;
}

export function useAuth(): AuthContextValue {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();

        if (isMounted) {
          setUser(currentUser);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  };

  return {
    isAuthenticated: Boolean(user),
    isLoading,
    user,
    getUser: getCurrentUser,
    signOut,
  };
}
