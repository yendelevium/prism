import React from "react";
import { render } from "@testing-library/react";
import { CustomBarShape, TreeTick } from "../GanttChartPanel";
import { GanttData } from "../types";

describe("CustomBarShape", () => {
  const basePayload: GanttData = {
    id: "1",
    trace_id: "t1",
    span_id: "s1",
    parent_span_id: null,
    operation: "op1",
    service_name: "svc1",
    start_time: 0,
    duration: 100,
    status: "ok",
    offset: 0,
    durationMs: 0.1,
    yIndex: 0,
    depth: 0,
  };

  it("does not render offset bars", () => {
    const { container } = render(
      <svg>
        <CustomBarShape
          dataKey="offset"
          x={0}
          y={0}
          width={10}
          height={10}
          payload={basePayload}
        />
      </svg>,
    );

    expect(container.querySelector("rect")).toBeNull();
  });

  it("renders success duration bar correctly", () => {
    const { container } = render(
      <svg>
        <CustomBarShape
          dataKey="durationMs"
          x={0}
          y={0}
          width={50}
          height={10}
          payload={{ ...basePayload, status: "ok" }}
        />
      </svg>,
    );

    const rect = container.querySelector("rect") as SVGRectElement;

    expect(rect).toBeTruthy();
    expect(rect.getAttribute("fill")).toBe("#A3BE8C");
    expect(rect.getAttribute("x")).toBe("0");
    expect(rect.getAttribute("y")).toBe("0");
    expect(rect.getAttribute("width")).toBe("50");
    expect(rect.getAttribute("height")).toBe("10");
  });

  it("renders error duration bar correctly", () => {
    const { container } = render(
      <svg>
        <CustomBarShape
          dataKey="durationMs"
          x={5}
          y={5}
          width={20}
          height={5}
          payload={{ ...basePayload, status: "error" }}
        />
      </svg>,
    );

    const rect = container.querySelector("rect") as SVGRectElement;

    expect(rect).toBeTruthy();
    expect(rect.getAttribute("fill")).toBe("#BF616A");
  });
});

describe("TreeTick", () => {
  const fullData: GanttData[] = [
    {
      id: "1",
      trace_id: "t1",
      span_id: "s1",
      parent_span_id: null,
      operation: "op1",
      service_name: "svc1",
      start_time: 0,
      duration: 100,
      status: "ok",
      offset: 0,
      durationMs: 0.1,
      yIndex: 0,
      depth: 0,
    },
    {
      id: "2",
      trace_id: "t1",
      span_id: "s2",
      parent_span_id: "s1",
      operation: "op2",
      service_name: "svc2",
      start_time: 10,
      duration: 50,
      status: "ok",
      offset: 10,
      durationMs: 0.05,
      yIndex: 1,
      depth: 1,
    },
  ];

  it("renders nothing if tick has no matching span", () => {
    const { container } = render(
      <TreeTick
        x={0}
        y={0}
        payload={{ value: "unknown" }}
        fullData={fullData}
      />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders root span labels correctly", () => {
    const { container } = render(
      <svg>
        <TreeTick x={0} y={0} payload={{ value: "s1" }} fullData={fullData} />
      </svg>,
    );

    const texts = container.querySelectorAll("text");

    expect(texts.length).toBe(2);
    expect(texts[0].textContent).toContain("op1");
    expect(texts[1].textContent).toContain("svc1");

    // baseLabelX is always -20
    expect(texts[0].getAttribute("x")).toBe("-20");
    expect(container.querySelector("path")).toBeNull();
  });

  it("renders child span with guide line", () => {
    const { container } = render(
      <svg>
        <TreeTick x={0} y={0} payload={{ value: "s2" }} fullData={fullData} />
      </svg>,
    );

    const texts = container.querySelectorAll("text");

    expect(texts[0].textContent).toContain("op2");
    expect(texts[1].textContent).toContain("svc2");

    // x does NOT change with depth anymore
    expect(texts[0].getAttribute("x")).toBe("-20");

    // depth > 0 → guide line exists
    expect(container.querySelector("path")).toBeTruthy();
  });
});
