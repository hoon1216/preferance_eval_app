import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  studentId: z.string().optional(),
  role: z.enum(["PROFESSOR", "STUDENT"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
    }

    const { email, password, name, studentId, role } = parsed.data;
    const normalizedName = name.trim();

    if (!normalizedName) {
      return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
    }

    if (role === "STUDENT" && !studentId) {
      return NextResponse.json({ error: "학생은 학번이 필요합니다." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "이미 등록된 이메일입니다." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name: normalizedName,
        studentId: role === "STUDENT" ? studentId : null,
        passwordHash,
        role,
        profileComplete: true,
      },
      select: { id: true, email: true, name: true, role: true, studentId: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("[register]", error);
    const message =
      error instanceof Error && error.message.includes("does not exist")
        ? "데이터베이스 테이블이 아직 준비되지 않았습니다. 관리자에게 문의하세요."
        : "회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
