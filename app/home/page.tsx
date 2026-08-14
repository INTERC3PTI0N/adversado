import { redirect } from "next/navigation";

/** Legacy `/home` route — the real homepage now lives at `/`. */
export default function HomeRedirect() {
  redirect("/");
}
