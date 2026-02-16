import React from "react";
import TraceGanttClient from "./GanttChartPanel";
import { Span } from "./types";

export default async function TracePage() {
  // Sample data simulating a distributed trace
  const sampleSpans: Span[] = [
    {
      id: 1,
      trace_id: "t1",
      span_id: "s1",
      parent_span_id: null,
      operation: "GET /api/user",
      service_name: "gateway",
      start_time: 1715000000000,
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
      start_time: 1715000000050,
      duration: 150,
      status: "ok",
    },
    {
      id: 3,
      trace_id: "t1",
      span_id: "s3",
      parent_span_id: "s1",
      operation: "fetch_profile",
      service_name: "user-svc",
      start_time: 1715000000250,
      duration: 450,
      status: "ok",
    },
    {
      id: 4,
      trace_id: "t1",
      span_id: "s4",
      parent_span_id: "s3",
      operation: "get_db_instance",
      service_name: "user-svc",
      start_time: 1715000000275,
      duration: 100,
      status: "ok",
    },
    {
      id: 5,
      trace_id: "t1",
      span_id: "s5",
      parent_span_id: "s4",
      operation: "db_query",
      service_name: "db-svc",
      start_time: 1715000000400,
      duration: 250,
      status: "error",
    },
  ];

  return <TraceGanttClient spans={sampleSpans} />;
}
