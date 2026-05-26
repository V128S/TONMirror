import { redirect } from "next/navigation";
export default function ActivityPage() {
  redirect("/market?tab=activity");
}
