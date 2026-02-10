// __tests__/GanttChartPanel.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TraceGanttClient from "../GanttChartPanel";
import { Span } from "../types";

// Sample span data
const spans: Span[] = [
  {
    id: 1,
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
    id: 2,
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

describe("TraceGanttClient", () => {
  it("renders without crashing", () => {
    render(<TraceGanttClient spans={spans} />);
    // Check zoom buttons exist
    expect(screen.getByText("+")).toBeInTheDocument();
    expect(screen.getByText("−")).toBeInTheDocument();
    expect(screen.getByText("Reset")).toBeInTheDocument();
  });

  it("renders span labels correctly with hierarchy", () => {
    render(<TraceGanttClient spans={spans} />);
    // Primary operation labels
    expect(screen.getByText("GET /api/user")).toBeInTheDocument();
    expect(screen.getByText("auth_user")).toBeInTheDocument();

    // Secondary service labels
    expect(screen.getByText("gateway")).toBeInTheDocument();
    expect(screen.getByText("auth-svc")).toBeInTheDocument();
  });

  it("renders bars with correct colors based on status", () => {
    const { container } = render(<TraceGanttClient spans={spans} />);
    const rects = container.querySelectorAll("rect");

    // Skip offset bars (first bar) and check the visible duration bar
    const durationBars = Array.from(rects).filter(
      (r) => r.getAttribute("fill") !== null
    );

    // First span is ok → success color
    expect(durationBars[0].getAttribute("fill")).toBe("#A3BE8C");

    // Second span is error → error color
    expect(durationBars[1].getAttribute("fill")).toBe("#BF616A");
  });

  it("computes offset and depth correctly", () => {
    const { container } = render(<TraceGanttClient spans={spans} />);
    const texts = screen.getAllByText(/GET|auth_user/i);

    // Get x values as numbers
    const xValues = texts.map((t) => Number(t.getAttribute("x")));

    // The first root span
    expect(xValues[0]).toBe(-180); // Or just check relative
    // Each child should be indented by 16 pixels per depth
    expect(xValues[1] - xValues[0]).toBe(16); // depth 1

  });

  it("handles zoom and reset button clicks", () => {
    render(<TraceGanttClient spans={spans} />);

    const zoomInButton = screen.getByText("+");
    const zoomOutButton = screen.getByText("−");
    const resetButton = screen.getByText("Reset");

    // Fire events and ensure buttons are clickable
    fireEvent.click(zoomInButton);
    fireEvent.click(zoomOutButton);
    fireEvent.click(resetButton);

    // No errors thrown, basic smoke test passes
    expect(true).toBe(true);
  });
});
