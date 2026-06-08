import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

const profileUpdateSchema = z.object({
  email: z.string().optional(),
  studentId: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  newPasswordConfirm: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      studentId: true,
      role: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
    }

    const { email, studentId, currentPassword, newPassword, newPasswordConfirm } =
      parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    if (email !== undefined && email.trim()) {
      const emailCheck = z.string().email().safeParse(email.trim());
      if (!emailCheck.success) {
        return NextResponse.json(
          { error: "이메일 형식이 올바르지 않습니다." },
          { status: 400 }
        );
      }
    }

    const wantsPasswordChange = Boolean(newPassword?.trim());

    if (wantsPasswordChange) {
      if (newPassword!.length < 6) {
        return NextResponse.json(
          { error: "새 비밀번호는 6자 이상이어야 합니다." },
          { status: 400 }
        );
      }
      if (!currentPassword) {
        return NextResponse.json(
          { error: "비밀번호를 변경하려면 현재 비밀번호를 입력해주세요." },
          { status: 400 }
        );
      }
      if (newPassword !== newPasswordConfirm) {
        return NextResponse.json(
          { error: "새 비밀번호 확인이 일치하지 않습니다." },
          { status: 400 }
        );
      }
      const passwordOk = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!passwordOk) {
        return NextResponse.json(
          { error: "현재 비밀번호가 올바르지 않습니다." },
          { status: 400 }
        );
      }
    }

    const data: {
      email?: string | null;
      studentId?: string | null;
      passwordHash?: string;
    } = {};

    if (email !== undefined) {
      const normalizedEmail = email.trim();
      if (normalizedEmail) {
        const existing = await prisma.user.findFirst({
          where: { email: normalizedEmail, NOT: { id: user.id } },
        });
        if (existing) {
          return NextResponse.json(
            { error: "이미 사용 중인 이메일입니다." },
            { status: 400 }
          );
        }
        data.email = normalizedEmail;
      } else {
        data.email = null;
      }
    }

    if (studentId !== undefined) {
      if (user.role !== "STUDENT") {
        return NextResponse.json(
          { error: "학번은 학생만 변경할 수 있습니다." },
          { status: 400 }
        );
      }
      const normalizedStudentId = studentId.trim();
      if (!normalizedStudentId) {
        return NextResponse.json({ error: "학번을 입력해주세요." }, { status: 400 });
      }
      const existing = await prisma.user.findFirst({
        where: { studentId: normalizedStudentId, NOT: { id: user.id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "이미 사용 중인 학번입니다." },
          { status: 400 }
        );
      }
      data.studentId = normalizedStudentId;
    }

    if (wantsPasswordChange && newPassword) {
      data.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "변경할 항목이 없습니다." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        name: true,
        email: true,
        studentId: true,
        role: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[profile PATCH]", error);
    return NextResponse.json(
      { error: "개인정보 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
