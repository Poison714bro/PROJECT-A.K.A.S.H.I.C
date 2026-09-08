import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/crypto';

export async function GET(request: Request) {
  const cookieStore = cookies();
  const isProd = process.env.NODE_ENV === 'production';
  const cookieName = isProd ? '__Host-session' : 'session';
  const sessionCookie = cookieStore.get(cookieName);

  if (!sessionCookie || !sessionCookie.value) {
    return NextResponse.json(
      { success: false, error: { message: 'Authentication required.' } },
      { status: 401 }
    );
  }

  try {
    const decryptedPayload = decrypt(sessionCookie.value);
    const sessionData = JSON.parse(decryptedPayload);

    if (Date.now() > sessionData.exp) {
      return NextResponse.json(
        { success: false, error: { message: 'Session expired.' } },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: sessionData.user
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid session payload.' } },
      { status: 401 }
    );
  }
}
