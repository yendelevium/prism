import { clerkSetup } from "@clerk/testing/playwright";

async function globalSetup() {
  console.log("Global Setup: Calling clerkSetup()...");
  await clerkSetup();
  console.log("Global Setup: clerkSetup() completed.");
}

export default globalSetup;
