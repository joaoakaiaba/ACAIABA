import { describe, it, expect } from "vitest";
import {
  isRevenueStatus,
  computeAverageTicket,
  getPeriodRange,
  buildDayBucket,
  formatDayLabel,
} from "../../src/lib/commerce/metrics";

describe("Revenue status classification", () => {
  it("should treat paid/fulfilled statuses as revenue", () => {
    expect(isRevenueStatus("PAID")).toBe(true);
    expect(isRevenueStatus("PROCESSING")).toBe(true);
    expect(isRevenueStatus("SHIPPED")).toBe(true);
    expect(isRevenueStatus("DELIVERED")).toBe(true);
  });

  it("should NOT treat pending/cancelled/refunded as revenue", () => {
    expect(isRevenueStatus("PENDING")).toBe(false);
    expect(isRevenueStatus("AWAITING_PAYMENT")).toBe(false);
    expect(isRevenueStatus("CANCELLED")).toBe(false);
    expect(isRevenueStatus("REFUNDED")).toBe(false);
    expect(isRevenueStatus(null)).toBe(false);
  });
});

describe("Average ticket", () => {
  it("should compute revenue / revenue-orders", () => {
    expect(computeAverageTicket(1000, 5)).toBe(200);
    expect(computeAverageTicket(250, 2)).toBe(125);
  });

  it("should return 0 when there are no revenue orders", () => {
    expect(computeAverageTicket(100, 0)).toBe(0);
  });
});

describe("Period ranges", () => {
  it("should produce a 1-day window for 'today'", () => {
    const now = new Date(2026, 7, 24, 15, 30); // Aug 24 2026 15:30
    const { start, end } = getPeriodRange("today", now);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect((end.getTime() - start.getTime()) / 86400000).toBe(1);
  });

  it("should produce a 7-day window for '7d'", () => {
    const now = new Date(2026, 7, 24, 15, 30);
    const { start, end } = getPeriodRange("7d", now);
    expect((end.getTime() - start.getTime()) / 86400000).toBe(7);
  });

  it("should produce a 30-day window for '30d'", () => {
    const now = new Date(2026, 7, 24, 15, 30);
    const { start, end } = getPeriodRange("30d", now);
    expect((end.getTime() - start.getTime()) / 86400000).toBe(30);
  });
});

describe("Day bucket (contiguous chart)", () => {
  it("should build contiguous buckets with zero-filled days", () => {
    const now = new Date(2026, 7, 24, 15, 30);
    const bucket = buildDayBucket("7d", now);
    expect(bucket.size).toBe(7);
    // Every day starts at zero.
    Array.from(bucket.values()).forEach((v) => {
      expect(v).toEqual({ revenue: 0, orders: 0 });
    });
  });

  it("should format day labels as YYYY-MM-DD", () => {
    expect(formatDayLabel(new Date(2026, 7, 24))).toBe("2026-08-24");
  });
});
