import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

/**
 * Registration page.  Allows a user to create a new account by
 * providing a username and at least one phone or email.  On success,
 * stores the returned JWT in localStorage and redirects to the home
 * page.  An OTP-based verification step is used for added robustness.
 */
export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Redirect authenticated users away from the registration page
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      router.replace("/");
    }
  }, [router]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone && !email) {
      setError("A phone or email is required to send OTP");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const contact = phone ? phone : email;
      const resp = await fetch("/api/register/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.message || "Failed to send OTP");
      } else {
        // In production the OTP would be sent via SMS/email.  For demo purposes we display it.
        setMessage(`OTP sent: ${data.otp}`);
        setStep(2);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!username || (!phone && !email)) {
      setError("Username and at least one contact method are required");
      return;
    }
    if (!otp) {
      setError("OTP is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          phones: phone ? [{ value: phone, label: "mobile" }] : [],
          emails: email ? [{ value: email, label: "work" }] : [],
          otp,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.message || "Registration failed");
      } else {
        // Save token and redirect
        if (typeof window !== "undefined" && data.token) {
          localStorage.setItem("accessToken", data.token);
        }
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Register</title>
      </Head>
      <div className="max-w-md w-full space-y-8 bg-white p-6 rounded-lg shadow">
        <h2 className="mt-1 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
        {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        {message && <div className="text-green-600 text-sm text-center">{message}</div>}
        {step === 1 && (
          <form className="mt-8 space-y-4" onSubmit={handleSendOtp}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="mb-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mb-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send OTP"}
              </button>
            </div>
          </form>
        )}
        {step === 2 && (
          <form className="mt-8 space-y-4" onSubmit={handleRegister}>
            <div className="rounded-md shadow-sm -space-y-px">
              {/* OTP input */}
              <div className="mb-2">
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">OTP</label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Registering…" : "Register"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

