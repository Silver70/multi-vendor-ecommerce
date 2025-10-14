import { useClerk } from "@clerk/tanstack-react-start";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";

export function LogoutButton() {
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate({ to: "/auth/login" });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Button variant="outline" onClick={handleLogout}>
      Logout
    </Button>
  );
}

// Example usage in a component:
// import { LogoutButton } from "~/components/LogoutButton";
//
// function MyComponent() {
//   return (
//     <div>
//       <LogoutButton />
//     </div>
//   );
// }
