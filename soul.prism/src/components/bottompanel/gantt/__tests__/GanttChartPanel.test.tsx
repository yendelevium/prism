import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TraceGanttClient from "../GanttChartPanel";
import { Span } from "@/@types/spanItem";

const spans: Span[] = [
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

describe("TraceGanttClient", () => {
  it("renders without crashing", () => {
    render(<TraceGanttClient spans={spans} />);

    expect(screen.getByText("+")).toBeInTheDocument();
    expect(screen.getByText("−")).toBeInTheDocument();
    expect(screen.getByText("Reset")).toBeInTheDocument();
  });

  it("renders span labels", () => {
    render(<TraceGanttClient spans={spans} />);

    // getAllByText because SVG <title> duplicates text nodes
    expect(screen.getAllByText("GET /api/user")[0]).toBeInTheDocument();
    expect(screen.getAllByText("auth_user")[0]).toBeInTheDocument();
    expect(screen.getAllByText("gateway")[0]).toBeInTheDocument();
    expect(screen.getAllByText("auth-svc")[0]).toBeInTheDocument();
  });

  it("renders bars with correct colors", () => {
    const { container } = render(<TraceGanttClient spans={spans} />);

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
    const { container } = render(<TraceGanttClient spans={spans} />);

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
    render(<TraceGanttClient spans={spans} />);

    fireEvent.click(screen.getByText("+"));
    fireEvent.click(screen.getByText("−"));
    fireEvent.click(screen.getByText("Reset"));

    // smoke test
    expect(true).toBe(true);
  });
});
