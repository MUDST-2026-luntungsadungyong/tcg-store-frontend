import { useState, type FormEvent } from "react";
import { ArrowLeft, Mail, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/shared/components/Input";
import { Button } from "@/shared/components/Button";
import { profileApi } from "../api/profile";
import { useAuthStore } from "@/features/auth/model/useAuthStore";

export function EditProfilePage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const nav = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const updated = await profileApi.update({ name, email });
      if (token) login(token, updated);
      nav("/profile");
    } catch {
      setError("Unable to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <button
        type="button"
        onClick={() => nav("/profile")}
        className="inline-flex min-h-11 items-center gap-2 px-1 text-sm font-medium text-gray-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-bg-base"
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Back to profile
      </button>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-white">
        Edit Profile
      </h1>
      <form
        onSubmit={save}
        className="mt-7 rounded-xl border border-white/10 bg-bg-surface p-5 sm:p-6"
      >
        <div className="space-y-5">
          <Input
            id="name"
            label="Full name"
            icon={UserRound}
            placeholder="e.g. Naphat Phoruang"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
          />
          <Input
            id="email"
            label="Email"
            type="email"
            icon={Mail}
            placeholder="name@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>
        {error && (
          <p className="mt-5 text-sm text-status-danger" role="alert">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => nav("/profile")}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Save changes
          </Button>
        </div>
      </form>
    </main>
  );
}
