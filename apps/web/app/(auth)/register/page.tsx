"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    businessName: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      await updateProfile(user, { displayName: form.name });

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: form.name,
        email: form.email,
        businessName: form.businessName,
        createdAt: serverTimestamp(),
        onboardingComplete: false,
      });

      // Create initial risk profile
      await setDoc(doc(db, "riskProfiles", user.uid), {
        companyId: user.uid,
        identityRisk: 0,
        transactionRisk: 0,
        communicationRisk: 0,
        counterpartyRisk: 0,
        dealRisk: 0,
        overallRisk: 0,
        trend: "STABLE",
        status: "LOW",
        updatedAt: serverTimestamp(),
      });

      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("email-already-in-use")) {
          setError("An account with this email already exists.");
        } else if (err.message.includes("weak-password")) {
          setError("Password must be at least 6 characters.");
        } else {
          setError("Registration failed. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(232,93,38,0.16),transparent_35%),linear-gradient(135deg,#F5F0E8_0%,#fff_45%,#F5F0E8_100%)] p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 rounded-full border border-[#1A1A18] bg-[#1A1A18] px-4 py-2 shadow-sm">
            <Shield className="h-10 w-10 text-[#E85D26]" />
            <span className="text-3xl font-bold tracking-tight text-[#F5F0E8]">VIGIL</span>
          </div>
          <p className="text-sm text-[#1A1A18]/70">
            Cyber Risk Intelligence for MSMEs
          </p>
        </div>

        <Card className="border-[#1A1A18]/15 bg-white/90 shadow-[0_18px_45px_rgba(26,26,24,0.12)] backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Create account</CardTitle>
            <CardDescription>
              Start monitoring your business cyber risk
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  placeholder="Priya Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">Business name</Label>
                <Input
                  id="businessName"
                  placeholder="Sharma Enterprises"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="priya@sharma.in"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full bg-[#E85D26] text-white hover:bg-[#C44D1E]" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-[#E85D26] hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
