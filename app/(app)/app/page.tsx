import { redirect } from "next/navigation";

/** Someone arriving at the app starts where a new user starts: an empty workspace. */
export default function AppIndex() {
  redirect("/app/new");
}
