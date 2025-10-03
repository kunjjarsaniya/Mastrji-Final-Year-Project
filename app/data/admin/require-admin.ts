import "server-only";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export async function requireAdmin(returnJson = false) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      console.warn('No active session found');
      if (returnJson) {
        throw new UnauthorizedError('Authentication required');
      }
      redirect('/login');
    }

    const userRole = (session.user.role || '').toString().toLowerCase();
    if (userRole !== 'admin') {
      console.warn(`Access denied for user ${session.user.id} with role ${session.user.role}`);
      if (returnJson) {
        throw new UnauthorizedError('Insufficient permissions');
      }
      redirect('/not-admin');
    }

    return session;
  } catch (error) {
    console.error('Error in requireAdmin:', error);
    if (returnJson) {
      throw error;
    }
    redirect('/error');
  }
}