import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LockIcon, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if user is admin
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .single();
        
        if (roles) {
          navigate("/");
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up new user
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Assign admin role to new user
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({ user_id: data.user.id, role: "admin" });

          if (roleError) {
            console.error("Role assignment error:", roleError);
            setError("Account created but role assignment failed. Please contact support.");
            return;
          }

          toast.success("Admin account created successfully!");
          navigate("/");
        }
      } else {
        // Sign in existing user
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          // Check if user has admin role
          const { data: roles, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id)
            .eq("role", "admin")
            .single();

          if (roleError || !roles) {
            setError("Access denied. Admin privileges required.");
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }

          toast.success("Logged in successfully");
          navigate("/");
        }
      }
    } catch (err: any) {
      setError(err.message || `${isSignUp ? 'Sign up' : 'Login'} failed. Please check your credentials.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <LockIcon className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {isSignUp ? "Create Admin Account" : "Admin Login"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isSignUp 
              ? "Register your admin account to access the dashboard" 
              : "Sign in to access the payment dashboard"
            }
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading 
              ? (isSignUp ? "Creating account..." : "Signing in...") 
              : (isSignUp ? "Create Admin Account" : "Sign In")
            }
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-sm text-primary hover:underline"
            disabled={isLoading}
          >
            {isSignUp 
              ? "Already have an account? Sign in" 
              : "Need an account? Create one"
            }
          </button>
        </div>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>Admin access only</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
