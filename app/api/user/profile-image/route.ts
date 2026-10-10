import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { existsSync, mkdirSync } from "fs";

export async function POST(request: Request) {
  try {
    const session = await auth();
    console.log("[UPLOAD-API] incoming session:", JSON.stringify(session?.user, null, 2));
    if (!session?.user?.id) {
      console.error("[UPLOAD-API] UNAUTHORIZED: no session.user.id found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    // Use Array.from to avoid downlevelIteration flag
    const formKeys = Array.from(formData.keys());
    console.log("[UPLOAD-API] formData keys:", formKeys);
    const entriesArr = Array.from(formData.entries());
    for (let i = 0; i < entriesArr.length; i++) {
      const [k, v] = entriesArr[i];
      if (k === "image") {
        const f = v as File;
        console.log(`[UPLOAD-API] formData[${k}] name=${f.name}, type=${f.type}, size=${f.size}`);
      }
    }
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Create unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `profile-${session.user.id}-${Date.now()}.${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Update user in database
    const imageUrl = `/uploads/${fileName}`;
    const userIdNumber = parseInt(session.user.id as string);
    console.log("[UPLOAD-API] session.user.id raw:", session.user.id, "parsed:", userIdNumber);
    console.log("[UPLOAD-API] imageUrl to save:", imageUrl);
    console.log("[UPLOAD-API] file written to:", filePath, "size:", buffer.length, "bytes");

    const updatedUser = await db.user.update({
      where: { id: userIdNumber },
      data: { profileImage: imageUrl },
      include: {
        role: true,
        ruangan: true,
      },
    });
    console.log("[UPLOAD-API] DB update OK. user.profileImage now:", updatedUser.profileImage);
    console.log("[UPLOAD-API] updatedUser full:", JSON.stringify(updatedUser, null, 2));

    // Log to audit trail
    await db.auditTrail.create({
      data: {
        userId: parseInt(session.user.id),
        userName: session.user.name || "",
        entityType: "User",
        entityId: parseInt(session.user.id),
        action: "UPDATE_PROFILE_IMAGE",
        moduleName: "Profile",
        field: "profileImage",
        newValue: imageUrl,
      },
    });

    return NextResponse.json({ success: true, imageUrl, updatedUser });
  } catch (error) {
    console.error("Upload profile image error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
