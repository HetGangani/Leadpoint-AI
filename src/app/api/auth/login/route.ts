import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signSessionToken, sanitizeUser, AUTH_COOKIE_NAME } from '@/lib/auth';
import { UserRole } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Fetch user with companyProfile
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        companyProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Sign session token
    const token = await signSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      companyProfileId: user.companyProfile?.id || null,
    });

    // Log login action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'Unknown',
      },
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        companyProfile: user.companyProfile,
      },
    });

    // Set HTTP-only cookie
    response.headers.append(
      'Set-Cookie',
      `${AUTH_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );

    return response;
  } catch (error: any) {
    console.error('Error in login:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
