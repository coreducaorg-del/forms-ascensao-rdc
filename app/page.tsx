import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default function Home() {
  const headersList = headers();
  const host = headersList.get("host") || "";

  if (host.includes("aulaodecoreano.online")) {
    redirect("/baseinterna");
  }

  redirect("/formulario");
}
