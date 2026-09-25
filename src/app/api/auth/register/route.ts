import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signSessionToken, sanitizeUser, AUTH_COOKIE_NAME } from '@/lib/auth';
import { isValidEmail } from '@/lib/lead-service';
import { UserRole } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, companyName, companyWebsite, companyDescription } = body;

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Valid business email is required.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists.' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    // Security: Never trust client-supplied role on public registration; always default to CLIENT
    const assignedRole = UserRole.CLIENT;

    // Create user in DB
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        role: assignedRole,
        passwordHash: hashedPassword,
      },
    });

    // Create CompanyProfile for user
    const companyProfile = await prisma.companyProfile.create({
      data: {
        userId: newUser.id,
        name: companyName?.trim() || `${name.trim()}'s Organization`,
        website: companyWebsite?.trim() || 'https://example.com',
        description: companyDescription?.trim() || 'Enterprise software & consulting services.',
        targetKeywords: JSON.stringify(['Enterprise IT', 'Cloud Modernization']),
        offerings: JSON.stringify({ services: [] }),
        validationStatus: 'APPROVED',
      },
    });

    // Create Subscription and SubscriptionUsage
    const subscription = await prisma.subscription.create({
      data: {
        userId: newUser.id,
        plan: 'STARTER',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.subscriptionUsage.create({
      data: {
        userId: newUser.id,
        subscriptionId: subscription.id,
        plan: 'STARTER',
        minutesUsed: 0,
        minutesLimit: 250,
        contactCredits: 0,
        contactCreditsLimit: 500,
        billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Log audit log
    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: 'USER_REGISTERED',
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'Unknown',
        metadata: JSON.stringify({ email: normalizedEmail, role: assignedRole }),
      },
    });

    // Create session token
    const token = await signSessionToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as UserRole,
      companyProfileId: companyProfile.id,
    });

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: sanitizeUser(newUser),
          companyProfile,
        },
      },
      { status: 201 }
    );

    // Set HTTP-only cookie
    response.headers.append(
      'Set-Cookie',
      `${AUTH_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );

    return response;
  } catch (error: any) {
    console.error('Error in registration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
