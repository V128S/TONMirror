import { redirect } from "next/navigation";

// Root → redirect to Home tab
export default function RootPage() {
  redirect("/home");
}
