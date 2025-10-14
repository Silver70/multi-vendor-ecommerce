import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { requireAuth } from "~/middleware/auth";
import { useAuth } from "~/context/AuthContext";
import { useClerk } from "@clerk/tanstack-react-start";
import { Button } from "~/components/ui/button";
import { DebugSyncUser } from "~/components/DebugSyncUser";
import { useEffect } from "react";

export const Route = createFileRoute("/dashboard/overview")({
  beforeLoad: requireAuth,
  component: RouteComponent,
});

function RouteComponent() {
  // @ts-ignore
  const { user, loading, clerkUser, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  // Redirect to login if not signed in
  useEffect(() => {
    if (!loading && !isSignedIn) {
      navigate({ to: "/auth/login" });
    }
  }, [loading, isSignedIn, navigate]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate({ to: "/auth/login" });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Debug component for manual sync - only in development */}
        {import.meta.env.DEV && <DebugSyncUser />}

        <div className="bg-card border rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Dashboard Overview</h1>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading user information...</div>
            </div>
          ) : user ? (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <h2 className="text-lg font-semibold mb-2">
                  Welcome back, {user.name}! 👋
                </h2>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                  <p>
                    <span className="font-medium">Role:</span> {user.role}
                  </p>
                  <p>
                    <span className="font-medium">Database User ID:</span> {user.id}
                  </p>
                  {user.clerkId && (
                    <p>
                      <span className="font-medium">Clerk ID:</span> {user.clerkId}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  You are successfully authenticated with Clerk and synced to the database.
                </p>
              </div>

              {/* Show Clerk user info for debugging */}
              {import.meta.env.DEV && clerkUser && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-semibold mb-2">Clerk User Info (Debug)</h3>
                  <div className="text-xs space-y-1">
                    <p><span className="font-medium">Clerk ID:</span> {clerkUser.id}</p>
                    <p><span className="font-medium">Email:</span> {clerkUser.primaryEmailAddress?.emailAddress}</p>
                    <p><span className="font-medium">Name:</span> {clerkUser.fullName}</p>
                    <p><span className="font-medium">Created:</span> {new Date(clerkUser.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ User not found in database
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                You're logged in with Clerk, but your user data hasn't been synced to the database yet.
                {import.meta.env.DEV && " Use the sync button above to manually sync your user."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
