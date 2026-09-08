import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';

// Standard predefined operator roles
const PREDEFINED_OPERATORS: Record<string, { role: string; clearanceLevel: number; name: string }> = {
  admin: { role: 'ADMIN', clearanceLevel: 3, name: 'System Administrator' },
  agent: { role: 'INVESTIGATOR', clearanceLevel: 2, name: 'Senior Field Investigator' },
  analyst: { role: 'ANALYST', clearanceLevel: 1, name: 'Intelligence Analyst' },
};

function setSessionCookie(response: NextResponse, userPayload: any) {
  const sessionPayload = {
    user: userPayload,
    exp: Date.now() + 86400 * 1000,
  };
  
  const jwe = encrypt(JSON.stringify(sessionPayload));
  
  const isProd = process.env.NODE_ENV === 'production';
  const cookieName = isProd ? '__Host-session' : 'session';

  response.cookies.set(cookieName, jwe, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 86400,
  });
  
  return response;
}

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
      const userPayload = {
        id: `usr-${cleanUsername}`,
        username: cleanUsername,
        role: op.role,
        clearanceLevel: op.clearanceLevel
      };
      const response = NextResponse.json({ success: true, data: { user: userPayload } });
      return setSessionCookie(response, userPayload);
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
        const userPayload = {
          id: dbUser.id,
          username: dbUser.username,
          role: dbUser.role || 'ANALYST',
          clearanceLevel: dbUser.clearanceLevel || 1
        };
        const response = NextResponse.json({ success: true, data: { user: userPayload } });
        return setSessionCookie(response, userPayload);
      }
    } catch {
      // Graceful fallback if database user table is unseeded
    }

    // If we reach here, neither the mock credentials nor the DB matched
    return NextResponse.json(
      { success: false, error: { message: 'Invalid credentials or operator clearance not found.' } },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, error: { message: 'Authentication error' } },
      { status: 500 }
    );
  }
}
