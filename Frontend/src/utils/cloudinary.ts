const CLOUDINARY_URL =
  "https://api.cloudinary.com/v1_1/sshubhamcloudinary/image/upload";

const CLOUDINARY_UPLOAD_PRESET = "comverse"; // EXACT from dashboard

export async function uploadToCloudinary(file: File): Promise<string> {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(CLOUDINARY_URL, {
    method: "POST",
    body: data,
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Cloudinary error:", err);
    throw new Error(err?.error?.message || "Cloudinary upload failed");
  }

  const result = await res.json();
  return result.secure_url; // ✅ store this in DB
}
