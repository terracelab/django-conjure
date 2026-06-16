import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { FormRow } from "@/components/composed/form-field";
import { APP_TITLE } from "@/layouts/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi, ApiError } from "@/lib/api";
import { tokenStore } from "@/lib/auth";

const loginSchema = z.object({
  username: z.string().min(1, "Please enter your username."),
  password: z.string().min(1, "Please enter your password."),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { username: "", password: "" } });

  async function onSubmit(values: LoginValues) {
    setServerError(null);
    try {
      const data = await adminApi.login(values.username, values.password);
      tokenStore.save(data.access, data.refresh, data.user);
      // Bounce back to where the user was: RequireAuth passes `state.from`; a hard
      // redirect from logout() passes `?next=` instead.
      const nextParam = new URLSearchParams(location.search).get("next");
      const from = (location.state as { from?: string } | null)?.from ?? nextParam;
      navigate(from && from !== "/login" ? from : "/", { replace: true });
    } catch (error) {
      if (error instanceof ApiError) setServerError(error.status === 401 ? "Incorrect username or password, or you lack admin access." : error.message);
      else setServerError("A login error occurred. Please check your network.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar">
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-80 rounded border border-border bg-surface p-6 shadow-lg">
        <h1 className="mb-1 text-title font-bold">{APP_TITLE}</h1>
        <p className="mb-5 text-caption text-fg-muted">Sign in with your staff account.</p>
        <div className="flex flex-col gap-3">
          <FormRow label="Username" htmlFor="username" required error={form.formState.errors.username?.message}>
            <Input id="username" autoFocus autoComplete="username" aria-invalid={Boolean(form.formState.errors.username)} {...form.register("username")} />
          </FormRow>
          <FormRow label="Password" htmlFor="password" required error={form.formState.errors.password?.message}>
            <Input id="password" type="password" autoComplete="current-password" aria-invalid={Boolean(form.formState.errors.password)} {...form.register("password")} />
          </FormRow>
          {serverError && (
            <p role="alert" className="rounded border border-danger/30 bg-danger/5 px-2 py-1.5 text-caption text-danger">
              {serverError}
            </p>
          )}
          <Button type="submit" className="mt-1 w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </form>
    </div>
  );
}
