import { http, HttpResponse, delay } from "msw";

export const handlers = [
  // HTTPBIN mocks
  http.get("https://httpbin.org/get", () => {
    return HttpResponse.json({ url: "https://httpbin.org/get", method: "GET" });
  }),
  
  http.post("https://httpbin.org/post", () => {
    return HttpResponse.json({ test: true });
  }),
  
  http.get("https://httpbin.org/json", () => {
    return HttpResponse.json({ message: "Hello world!" });
  }),
  
  http.get("https://httpbin.org/delay/2", async () => {
    await delay(2000);
    return HttpResponse.json({ delayed: true });
  }),

  // EPIC 3 - Mock Server
  http.get("http://mockserver:3000/api/checkout", () => {
    return HttpResponse.json({ success: true, latency: 100 });
  }),

  http.get("http://mockserver:3000/api/payment", () => {
    return HttpResponse.json({ success: true });
  }),

  http.get("http://mockserver:3000/api/slow", async () => {
    await delay(3000);
    return HttpResponse.json({ timeout: true });
  }),

  // EPIC 4 - Workflow Mocks
  http.post("https://mockserver/register", () => {
    return HttpResponse.json({ registered: true });
  }),
  
  http.post("https://mockserver/verify", () => {
    return HttpResponse.json({ verified: true });
  }),
  
  http.post("https://mockserver/welcome-email", () => {
    return HttpResponse.json({ sent: true });
  }),

  http.post("http://localhost:3000/api/mock/login", () => {
    return HttpResponse.json({ token: "test-jwt" });
  }),

  http.get("http://localhost:3000/api/mock/profile", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (auth === "Bearer test-jwt") {
      return HttpResponse.json({ authenticated: true });
    }
    return new HttpResponse(null, { status: 401 });
  }),

  http.get("http://localhost:3000/api/mock/200", () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.get("http://localhost:3000/api/mock/empty-array", () => {
    return HttpResponse.json([]);
  }),

  http.get("http://localhost:3000/api/mock/child", () => {
    return HttpResponse.json({ child: true });
  }),
];
