import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TraceGanttClient from "../GanttChartPanel";
import { Span } from "@/@types/spanItem";
import * as spanStore from "@/stores/useSpanStore";

jest.mock("@/stores/useSpanStore", () => ({
  useSpanStore: jest.fn(),
}));

const mockSpans: Span[] = [
  {
    id: "1",
    trace_id: "t1",
    span_id: "s1",
    parent_span_id: null,
    operation: "GET /api/user",
    service_name: "gateway",
    start_time: 1000,
    duration: 500,
    status: "ok",
  },
  {
    id: "2",
    trace_id: "t1",
    span_id: "s2",
    parent_span_id: "s1",
    operation: "auth_user",
    service_name: "auth-svc",
    start_time: 1050,
    duration: 150,
    status: "error",
  },
];

const mockUseSpanStore = spanStore.useSpanStore as jest.MockedFunction<
  typeof spanStore.useSpanStore
>;

describe("TraceGanttClient", () => {
  beforeEach(() => {
    mockUseSpanStore.mockImplementation((selector: any) => {
      const state = { spans: mockSpans };
      return typeof selector === "function" ? selector(state) : state;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    render(<TraceGanttClient />);

    expect(screen.getByText("+")).toBeInTheDocument();
    expect(screen.getByText("−")).toBeInTheDocument();
    expect(screen.getByText("Reset")).toBeInTheDocument();
  });

  it("renders span labels", () => {
    render(<TraceGanttClient />);

    // getAllByText because SVG <title> duplicates text nodes
    expect(screen.getAllByText("GET /api/user")[0]).toBeInTheDocument();
    expect(screen.getAllByText("auth_user")[0]).toBeInTheDocument();
    expect(screen.getAllByText("gateway")[0]).toBeInTheDocument();
    expect(screen.getAllByText("auth-svc")[0]).toBeInTheDocument();
  });

  it("renders bars with correct colors", () => {
    const { container } = render(<TraceGanttClient />);

    const rects = Array.from(container.querySelectorAll("rect")).filter(
      (r) =>
        r.getAttribute("fill") === "#A3BE8C" ||
        r.getAttribute("fill") === "#BF616A",
    );

    expect(rects.length).toBe(2);
    expect(rects[0].getAttribute("fill")).toBe("#A3BE8C");
    expect(rects[1].getAttribute("fill")).toBe("#BF616A");
  });

  it("does not shift label x position by depth", () => {
    const { container } = render(<TraceGanttClient />);

    const textNodes = Array.from(container.querySelectorAll("text"));

    const rootLabel = textNodes.find((t) =>
      t.textContent?.includes("GET /api/user"),
    ) as SVGTextElement;

    const childLabel = textNodes.find((t) =>
      t.textContent?.includes("auth_user"),
    ) as SVGTextElement;

    expect(rootLabel.getAttribute("x")).toBe("-20");
    expect(childLabel.getAttribute("x")).toBe("-20");
  });

  it("handles zoom and reset button clicks", () => {
    render(<TraceGanttClient />);

    fireEvent.click(screen.getByText("+"));
    fireEvent.click(screen.getByText("−"));
    fireEvent.click(screen.getByText("Reset"));

    // smoke test
    expect(true).toBe(true);
  });
});
