import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: 'Authentication token required.' } },
      { status: 401 }
    );
  }

  // Determine user identity from token signature
  let username = 'analyst';
  let role = 'ANALYST';
  let clearanceLevel = 1;

  if (token.includes('admin')) {
    username = 'admin';
    role = 'ADMIN';
    clearanceLevel = 3;
  } else if (token.includes('agent')) {
    username = 'agent';
    role = 'INVESTIGATOR';
    clearanceLevel = 2;
  }

  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: `usr-${username}`,
        username,
        role,
        clearanceLevel
      }
    }
  });
}
