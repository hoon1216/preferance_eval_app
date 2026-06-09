import { auth } from "@/lib/auth";
import {
  canAccessSurveyForm,
  loadSurveyForm,
} from "@/lib/survey-form-access";
import { parseSurveyItemOptions } from "@/lib/survey-item-types";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId } = await params;
  const allowed = await canAccessSurveyForm(
    courseId,
    session.user.id,
    session.user.role
  );
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sections = await loadSurveyForm(courseId);

  return NextResponse.json({
    sections: sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      orderIndex: section.orderIndex,
      items: section.items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        required: item.required,
        orderIndex: item.orderIndex,
        options: parseSurveyItemOptions(item.options),
      })),
    })),
  });
}
