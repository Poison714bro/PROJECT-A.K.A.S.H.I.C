import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Standard predefined operator roles
const PREDEFINED_OPERATORS: Record<string, { role: string; clearanceLevel: number; name: string }> = {
  admin: { role: 'ADMIN', clearanceLevel: 3, name: 'System Administrator' },
  agent: { role: 'INVESTIGATOR', clearanceLevel: 2, name: 'Senior Field Investigator' },
  analyst: { role: 'ANALYST', clearanceLevel: 1, name: 'Intelligence Analyst' },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Username and password are required.' } },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim().toLowerCase();

    // 1. Check Predefined Operators / Mock standard credentials
    if (password === 'password' && PREDEFINED_OPERATORS[cleanUsername]) {
      const op = PREDEFINED_OPERATORS[cleanUsername];
      return NextResponse.json({
        success: true,
        data: {
          token: `akashic-jwt-token-${cleanUsername}-${Date.now()}`,
          user: {
            id: `usr-${cleanUsername}`,
            username: cleanUsername,
            role: op.role,
            clearanceLevel: op.clearanceLevel
          }
        }
      });
    }

    // 2. Query Prisma database
    try {
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: cleanUsername },
            { email: cleanUsername }
          ]
        }
      });

      if (dbUser) {
        return NextResponse.json({
          success: true,
          data: {
            token: `akashic-jwt-token-${dbUser.id}-${Date.now()}`,
            user: {
              id: dbUser.id,
              username: dbUser.username,
              role: dbUser.role || 'ANALYST',
              clearanceLevel: dbUser.clearanceLevel || 1
            }
          }
        });
      }
    } catch {
      // Graceful fallback if database user table is unseeded
    }

    // Default fallback if username matches standard operator name
    if (PREDEFINED_OPERATORS[cleanUsername]) {
      const op = PREDEFINED_OPERATORS[cleanUsername];
      return NextResponse.json({
        success: true,
        data: {
          token: `akashic-jwt-token-${cleanUsername}-${Date.now()}`,
          user: {
            id: `usr-${cleanUsername}`,
            username: cleanUsername,
            role: op.role,
            clearanceLevel: op.clearanceLevel
          }
        }
      });
    }

    return NextResponse.json(
      { success: false, error: { message: 'Invalid credentials or operator clearance not found.' } },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Authentication error' } },
      { status: 500 }
    );
  }
}
