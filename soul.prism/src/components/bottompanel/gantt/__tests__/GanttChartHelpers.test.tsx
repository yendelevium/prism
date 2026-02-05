// __tests__/GanttChartHelpers.test.tsx
import React from "react";
import { render } from "@testing-library/react";
import { CustomBarShape, TreeTick } from "../GanttChartPanel";
import { GanttData } from "../types";

describe("CustomBarShape", () => {
  it("does not render offset bars", () => {
    const { container } = render(
      <svg>
        <CustomBarShape dataKey="offset" x={0} y={0} width={10} height={10} payload={{}} />
      </svg>
    );
    expect(container.querySelector("rect")).toBeNull();
  });

  it("renders a duration bar with correct color for success", () => {
    const payload: GanttData = {
      id: 1,
      trace_id: "t1",
      span_id: "s1",
      parent_span_id: null,
      operation: "op1",
      service_name: "svc1",
      start_time: 0,
      duration: 100,
      status: "ok",
      offset: 0,
      yIndex: 0,
      depth: 0,
    };

    const { container } = render(
      <svg>
        <CustomBarShape dataKey="duration" x={0} y={0} width={50} height={10} payload={payload} />
      </svg>
    );

    const rect = container.querySelector("rect");
    expect(rect).not.toBeNull();
    expect(rect!.getAttribute("fill")).toBe("var(--success)");
    expect(rect!.getAttribute("x")).toBe("0");
    expect(rect!.getAttribute("y")).toBe("0");
    expect(rect!.getAttribute("width")).toBe("50");
    expect(rect!.getAttribute("height")).toBe("10");
  });

  it("renders a duration bar with correct color for error", () => {
    const payload: GanttData = {
      id: 2,
      trace_id: "t1",
      span_id: "s2",
      parent_span_id: null,
      operation: "op2",
      service_name: "svc2",
      start_time: 0,
      duration: 50,
      status: "error",
      offset: 0,
      yIndex: 0,
      depth: 0,
    };

    const { container } = render(
      <svg>
        <CustomBarShape dataKey="duration" x={5} y={5} width={20} height={5} payload={payload} />
      </svg>
    );

    const rect = container.querySelector("rect");
    expect(rect).not.toBeNull();
    expect(rect!.getAttribute("fill")).toBe("var(--error)");
  });
});

describe("TreeTick", () => {
  const fullData: GanttData[] = [
    {
      id: 1,
      trace_id: "t1",
      span_id: "s1",
      parent_span_id: null,
      operation: "op1",
      service_name: "svc1",
      start_time: 0,
      duration: 100,
      status: "ok",
      offset: 0,
      yIndex: 0,
      depth: 0,
    },
    {
      id: 2,
      trace_id: "t1",
      span_id: "s2",
      parent_span_id: "s1",
      operation: "op2",
      service_name: "svc2",
      start_time: 10,
      duration: 50,
      status: "ok",
      offset: 10,
      yIndex: 1,
      depth: 1,
    },
  ];

  it("renders nothing if the tick value has no matching data", () => {
    const { container } = render(
        <TreeTick x={0} y={0} payload={{ value: "unknown" }} fullData={fullData} />
    );

    expect(container.innerHTML).toBe("") // nothing rendered
  });

  it("renders root span labels correctly", () => {
    const { container, getByText } = render(
      <svg>
        <TreeTick x={0} y={0} payload={{ value: "s1" }} fullData={fullData} />
      </svg>
    );

    expect(getByText("op1")).toBeInTheDocument();
    expect(getByText("svc1")).toBeInTheDocument();

    // root depth → x = -180
    const text = container.querySelector("text");
    expect(text!.getAttribute("x")).toBe("-180");
  });

  it("renders child span labels with indentation and guide line", () => {
    const { container, getByText } = render(
      <svg>
        <TreeTick x={0} y={0} payload={{ value: "s2" }} fullData={fullData} />
      </svg>
    );

    expect(getByText("op2")).toBeInTheDocument();
    expect(getByText("svc2")).toBeInTheDocument();

    // child depth = 1 → x = -180 + 16
    const text = container.querySelector("text");
    expect(text!.getAttribute("x")).toBe(`${-180 + 16}`);

    // should also render a <path> for the guide line
    expect(container.querySelector("path")).not.toBeNull();
  });
});
