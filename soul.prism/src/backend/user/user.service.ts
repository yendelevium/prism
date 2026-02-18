import { clerkClient } from "@clerk/nextjs/server";

const client = await clerkClient();

export async function getUsernameByUserId(userId: string) {
  try {
    const user = await client.users.getUser(userId);
    const username = user.username;
    const firstName = user.firstName;
    const lastName = user.lastName;
    return username || firstName! + " " + lastName!; // Use whichever attribute is enabled
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}
