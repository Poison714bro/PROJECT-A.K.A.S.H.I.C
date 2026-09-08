import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ScraplingHarvester from "../ScraplingHarvester";
import { api } from "@/lib/apiClient";

vi.mock("@/lib/apiClient", () => ({
  api: {
    scraper: {
      harvest: vi.fn(),
      status: vi.fn(),
    },
    ingest: {
      pipeline: vi.fn().mockResolvedValue({ ok: true }),
    },
  },
}));

describe("ScraplingHarvester Component", () => {
  it("renders the Scrapling Harvester header and engine indicators", () => {
    render(<ScraplingHarvester />);
    expect(screen.getByText("Scrapling Web Harvester")).toBeInTheDocument();
    expect(screen.getByText("HTTP/3 STATIC")).toBeInTheDocument();
    expect(screen.getByText("HEADLESS DYNAMIC")).toBeInTheDocument();
    expect(screen.getByText("STEALTHY BYPASS")).toBeInTheDocument();
  });

  it("allows selecting different engine architectures", () => {
    render(<ScraplingHarvester />);
    const dynamicBtn = screen.getByText("Dynamic JS");
    fireEvent.click(dynamicBtn);
    expect(screen.getByText("Playwright Headless")).toBeInTheDocument();
  });

  it("renders presets and updates target URL when clicked", () => {
    render(<ScraplingHarvester />);
    const ecomPreset = screen.getByText("E-Commerce Catalog");
    fireEvent.click(ecomPreset);

    const input = screen.getByPlaceholderText("https://target-domain.com/catalog") as HTMLInputElement;
    expect(input.value).toBe("https://books.toscrape.com/");
  });

  it("executes live harvest and displays extracted records", async () => {
    const mockData = {
      success: true,
      url: "https://quotes.toscrape.com/",
      status_code: 200,
      fetcher_type: "static",
      engine: "scrapling-static",
      title: "Quotes to Scrape",
      text: "The world as we have created it...",
      items: [
        {
          title: "The world as we have created it",
          price: "$19.99",
          price_value: 19.99,
          currency: "$",
          availability: "In Stock",
          in_stock: true,
          description: "Albert Einstein",
          url: "https://quotes.toscrape.com/quote-1",
        },
      ],
      links: ["https://quotes.toscrape.com/tag/change"],
      execution_time_ms: 120.5,
      threat_entities: {
        btc_wallets: ["bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2"],
      },
    };

    (api.scraper.harvest as any).mockResolvedValueOnce({
      ok: true,
      data: mockData,
    });

    render(<ScraplingHarvester />);
    const harvestBtn = screen.getByText("EXECUTE LIVE HARVEST");
    fireEvent.click(harvestBtn);

    await waitFor(() => {
      expect(screen.getByText("The world as we have created it")).toBeInTheDocument();
    });

    expect(screen.getByText("$19.99")).toBeInTheDocument();
    expect(screen.getByText("In Stock")).toBeInTheDocument();
    expect(screen.getByText("Albert Einstein")).toBeInTheDocument();
  });

  it("opens the Python code reproducibility modal", () => {
    render(<ScraplingHarvester />);
    const codeBtn = screen.getByTitle("View Python Code");
    fireEvent.click(codeBtn);

    expect(screen.getByText("Reproducible Semantica + Scrapling Python Snippet")).toBeInTheDocument();
    expect(screen.getByText("COPY CODE")).toBeInTheDocument();
  });
});
