import { useState } from "react";
import { useUser } from "@clerk/tanstack-react-start";
import { useAuth } from "~/context/AuthContext";
import { Button } from "~/components/ui/button";

/**
 * DEBUG ONLY - Remove in production
 * This component helps sync users manually when webhooks aren't working in local dev
 */
export function DebugSyncUser() {
  const { user: clerkUser } = useUser();
  //@ts-ignore
  const { getToken, fetchUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const syncUser = async () => {
    if (!clerkUser) {
      setMessage("No Clerk user found. Please log in first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const token = await getToken();
      const response = await fetch("http://localhost:5176/api/Debug/sync-current-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: clerkUser.fullName || `${clerkUser.firstName} ${clerkUser.lastName}`,
          email: clerkUser.primaryEmailAddress?.emailAddress,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        // Refresh user data
        await fetchUser();
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!clerkUser) {
    return null;
  }

  return (
    <div className="border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
      <div className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
        🚧 DEBUG MODE - Manual User Sync
      </div>
      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
        If you just registered/logged in but your user data isn't showing, click below to manually sync
        with the database. This is only needed when webhooks aren't set up yet.
      </p>
      <Button onClick={syncUser} disabled={loading} size="sm" variant="outline">
        {loading ? "Syncing..." : "Sync User to Database"}
      </Button>
      {message && (
        <p className="mt-2 text-sm text-yellow-800 dark:text-yellow-200">{message}</p>
      )}
    </div>
  );
}

// Usage example:
// Add this to your home page or dashboard:
//
// import { DebugSyncUser } from "~/components/DebugSyncUser";
//
// function HomePage() {
//   return (
//     <div>
//       {import.meta.env.DEV && <DebugSyncUser />}
//       {/* rest of your page */}
//     </div>
//   );
// }
