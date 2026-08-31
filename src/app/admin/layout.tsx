import { getAdminPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!getAdminPassword()) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-field mb-2">Acesso negado</h2>
        <p className="text-gray">Esta area e restrita.</p>
      </div>
    );
  }

  return children;
}
