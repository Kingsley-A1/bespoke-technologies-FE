import { Send } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { Panel, PanelHeader } from "@/features/admin/components/admin-ui";
import { EMAIL_SENDERS, SENDER_KEYS } from "@/lib/email/addresses";
import { ADMIN_EMAIL_TEMPLATES } from "@/lib/email/templates/admin";
import { isEmailConfigured } from "@/lib/email/client";
import { ComposeForm } from "./compose-form";

export default async function AdminOutreachPage() {
  const session = await requireAdminPermission("crm.manage");

  const templates = ADMIN_EMAIL_TEMPLATES.map((template) => ({
    key: template.key,
    label: template.label,
    description: template.description,
    defaults: template.defaults,
  }));

  const senders = SENDER_KEYS.map((key) => ({
    key,
    label: EMAIL_SENDERS[key].name,
    address: EMAIL_SENDERS[key].address,
  }));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700">
            <Send className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-blue-950">Compose &amp; send email</h2>
            <p className="mt-1 text-xs leading-5 text-blue-700">
              Start from a template, edit it, and send a branded email as a role or personal address.
              Replies route back to that inbox.
            </p>
          </div>
        </div>
      </section>

      {!isEmailConfigured() && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          Email is not configured yet — set <code>RESEND_API_KEY</code> to enable sending.
        </div>
      )}

      <Panel>
        <PanelHeader title="New email" description="Templates are starting points — edit anything before sending." />
        <div className="p-5 sm:p-6">
          <ComposeForm templates={templates} senders={senders} defaultSignOff={session.displayName} />
        </div>
      </Panel>
    </div>
  );
}
