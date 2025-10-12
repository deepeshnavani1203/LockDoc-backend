import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const signupnow = async (name, email, pass, cpass) => {
  try {
    const config = {
      method: "post",
      url: "https://lock-doc-backend.vercel.app/api/signup",
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        name: name,
        email: email,
        pass: pass,
        cpass: cpass,
      }),
    };

    const res = await axios(config);
    console.log(JSON.stringify({ name, email }));

    if (res.status === 200) {
      console.log("Success", "Signup successful!");
      return { success: true };
    } else {
      console.log("Error", "Something went wrong, please try again.");
      return { success: false, message: "Something went wrong" };
    }
  } catch (err) {
    console.log("Error in signup", err);
    if (err.response) {
      console.log("Error", "Something went wrong with the API request!");
      return {
        success: false,
        message: err.response.data?.message || "API error",
      };
    } else if (err.request) {
      console.log(
        "Error Network error! Please check your internet connection."
      );
      return { success: false, message: "Network error" };
    } else {
      console.log("Error", "An unexpected error occurred!");
      return { success: false, message: "Unexpected error" };
    }
  }
};

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Call backend API to store user in database
      const result = await signupnow(name, email, password, confirmPassword);

      if (result.success) {
        // Also store in local auth context
        const success = signup(email, password, name);

        if (success) {
          toast.success("Account created successfully! Please login.");
          navigate("/login");
        } else {
          toast.error("Email already exists in local storage");
        }
      } else {
        toast.error(result.message || "Failed to create account");
      }
    } catch (error) {
      toast.error("An error occurred during signup");
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-accent/5">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-accent/10 rounded-full">
                <Shield className="h-8 w-8 text-accent" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>
              Sign up to start securing your documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-accent hover:underline font-medium"
              >
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
