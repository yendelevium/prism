import { currentUser } from "@clerk/nextjs/server";

export default async function AuthTestPage() {
  const user = await currentUser();

  if (!user) {
    return (
      <main className="p-6">
        <h1 className="text-lg font-semibold">Auth Test</h1>
        <p className="text-sm text-neutral-400">Not signed in.</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold">Auth Test</h1>
      <div className="mt-4 space-y-2 text-sm">
        <div>
          <span className="font-medium">User ID:</span> {user.id}
        </div>
        <div>
          <span className="font-medium">Email:</span>{" "}
          {user.primaryEmailAddress?.emailAddress ?? "N/A"}
        </div>
        <div>
          <span className="font-medium">Name:</span> {user.fullName ?? "N/A"}
        </div>
      </div>
    </main>
  );
}
