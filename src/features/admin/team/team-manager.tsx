"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Archive, Pencil, Plus, UsersRound } from "lucide-react";
import { UploadLoading } from "@/features/admin/components/admin-loading";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass, textareaClass } from "@/features/admin/components/admin-ui";
import type { TeamMember } from "@/features/admin/types";

export function TeamManager({ members }: { members: TeamMember[] }) {
  const [editing, setEditing] = useState<TeamMember>();
  return (
    <div className="space-y-6">
      <details className="group rounded-lg border border-slate-200 bg-white shadow-card">
        <summary className="flex cursor-pointer list-none items-center justify-between p-5 sm:p-6">
          <div><h2 className="font-bold text-slate-950">Add a public team profile</h2><p className="mt-1 text-xs text-slate-500">Profiles remain drafts until an admin publishes them.</p></div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-ktf-blue group-open:hidden"><Plus className="h-4 w-4" /> New member</span>
        </summary>
        <div className="border-t border-slate-200 p-5 sm:p-6"><TeamForm /></div>
      </details>
      <section className="rounded-lg border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 sm:p-6"><div><h2 className="font-bold text-slate-950">Public team directory</h2><p className="mt-1 text-xs text-slate-500">{members.length} managed profiles.</p></div><UsersRound className="h-5 w-5 text-ktf-blue" /></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          {members.map((member) => <TeamAdminCard key={member.id} member={member} onEdit={() => setEditing(member)} />)}
          {!members.length && <p className="text-sm text-slate-500">No team profiles yet.</p>}
        </div>
      </section>
      {editing && <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/60 p-4 sm:p-8" role="dialog" aria-modal="true" aria-labelledby="team-editor-title"><button className="fixed inset-0" onClick={() => setEditing(undefined)} aria-label="Close editor" /><div className="relative mx-auto max-w-4xl rounded-xl bg-white p-5 shadow-2xl sm:p-7"><div className="mb-5 flex justify-between border-b border-slate-100 pb-4"><h2 id="team-editor-title" className="font-bold">Edit {editing.fullName}</h2><button className={secondaryButtonClass} onClick={() => setEditing(undefined)}>Close</button></div><TeamForm member={editing} onSaved={() => setEditing(undefined)} /></div></div>}
    </div>
  );
}

function TeamAdminCard({ member, onEdit }: { member: TeamMember; onEdit: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function archive() {
    if (!window.confirm(`Archive ${member.fullName}'s public profile?`)) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/admin/api/team-members/${member.id}`, {
        method: "DELETE",
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || "The team profile could not be archived.");
      }
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The team profile could not be archived.",
      );
    } finally {
      setPending(false);
    }
  }
  return <article className="overflow-hidden rounded-xl border border-slate-200">
    <div className="relative aspect-[4/3] bg-slate-100">{member.portraitKey ? <Image src={`/admin/api/team-members/${member.id}/portrait`} alt="" fill className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center text-xs text-slate-400">Portrait not uploaded</div>}<span className="absolute left-3 top-3 rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-bold text-white">{member.status}</span></div>
    <div className="p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-ktf-blue">{member.teamGroup} · {member.cardVariant}</p><h3 className="mt-2 font-bold text-slate-950">{member.fullName}</h3><p className="text-xs text-slate-500">{member.roleTitle}</p><div className="mt-4 flex gap-2"><button className={`${secondaryButtonClass} flex-1`} onClick={onEdit}><Pencil className="h-3.5 w-3.5" /> Edit</button><button disabled={pending} className="inline-flex h-9 items-center rounded-lg border border-amber-200 px-3 text-amber-700" onClick={archive} aria-label={`Archive ${member.fullName}`}><Archive className="h-3.5 w-3.5" /></button></div>{error && <p className="mt-3 text-xs font-semibold text-rose-700" role="alert">{error}</p>}</div>
  </article>;
}

function TeamForm({ member, onSaved }: { member?: TeamMember; onSaved?: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setMessage("");
    const response = await fetch(member ? `/admin/api/team-members/${member.id}` : "/admin/api/team-members", { method: member ? "PUT" : "POST", body: new FormData(event.currentTarget) });
    const body = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) return setMessage(body.error || "The team profile could not be saved.");
    router.refresh(); onSaved?.();
    if (!member) event.currentTarget.reset();
  }
  return <form onSubmit={submit} className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Full name"><input className={inputClass} name="fullName" defaultValue={member?.fullName} required /></Field>
      <Field label="Profile slug"><input className={inputClass} name="slug" defaultValue={member?.slug} placeholder="kingsley-maduchi" required /></Field>
      <Field label="Role"><input className={inputClass} name="roleTitle" defaultValue={member?.roleTitle} required /></Field>
      <Field label="Team group"><select className={inputClass} name="teamGroup" defaultValue={member?.teamGroup || "engineering"}>{["leadership","product","engineering","design","operations","partnerships"].map(value => <option key={value}>{value}</option>)}</select></Field>
      <Field label="Card design"><select className={inputClass} name="cardVariant" defaultValue={member?.cardVariant || "blueprint"}>{["blueprint","signal","grid","orbit"].map(value => <option key={value}>{value}</option>)}</select></Field>
      <Field label="Publishing state"><select className={inputClass} name="status" defaultValue={member?.status || "draft"}>{["draft","published","archived"].map(value => <option key={value}>{value}</option>)}</select></Field>
      <Field label="Display order"><input className={inputClass} name="displayOrder" type="number" min="0" defaultValue={member?.displayOrder || 0} /></Field>
      <Field label="Location"><input className={inputClass} name="location" defaultValue={member?.location} /></Field>
      <Field label={member ? "Replace portrait" : "Portrait"}><input className={inputClass} name="portrait" type="file" accept="image/png,image/jpeg,image/webp" /></Field>
      <Field label="Portrait description"><input className={inputClass} name="portraitAlt" defaultValue={member?.portraitAlt} placeholder="Portrait of..." /></Field>
      <Field label="LinkedIn"><input className={inputClass} name="linkedin" type="url" defaultValue={member?.links.linkedin} /></Field>
      <Field label="GitHub"><input className={inputClass} name="github" type="url" defaultValue={member?.links.github} /></Field>
      <Field label="Website"><input className={inputClass} name="website" type="url" defaultValue={member?.links.website} /></Field>
      <Field label="Specialties"><input className={inputClass} name="specialties" defaultValue={member?.specialties.join(", ")} placeholder="Cloud, Product strategy, AI" /></Field>
    </div>
    <Field label="Short bio"><textarea className={textareaClass} name="shortBio" minLength={20} maxLength={420} defaultValue={member?.shortBio} required /></Field>
    {pending && <UploadLoading label="Saving public team profile" />}
    {message && <p className="text-xs font-semibold text-rose-700" role="alert">{message}</p>}
    <button className={primaryButtonClass} disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
  </form>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label><span className={labelClass}>{label}</span>{children}</label>;
}
