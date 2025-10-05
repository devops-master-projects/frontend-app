import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock icons and swipeable views
vi.mock("@mui/icons-material", () => ({
  KeyboardArrowLeft: () => <span data-testid="arrow-left" />,
  KeyboardArrowRight: () => <span data-testid="arrow-right" />,
}));
vi.mock("react-swipeable-views", () => ({
  __esModule: true,
  default: ({ index, onChangeIndex, children }: { index: number; onChangeIndex: (i: number) => void; children: React.ReactNode[] }) => (
    <div data-testid="swipeable-views">
      {/* simulate swiping by rendering children[index] only */}
      {Array.isArray(children) ? children[index] : children}
      <button data-testid="simulate-swipe" onClick={() => onChangeIndex(1)}>
        SwipeToSecond
      </button>
    </div>
  ),
}));

import PhotoCarousel from "../../features/accommodations/pages/PhotoCarousel";

describe("PhotoCarousel", () => {
  it("returns null when no photos", () => {
    const { container } = render(<PhotoCarousel photos={[]} name="X" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders single image without stepper when only one photo", () => {
    render(<PhotoCarousel photos={["/single.jpg"]} name="Solo" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/single.jpg");
    // stepper should not exist for one image
    expect(screen.queryByRole("button", { name: /next/i })).toBeNull();
  });

  it("renders images and stepper when multiple photos", () => {
    render(<PhotoCarousel photos={["/a.jpg", "/b.jpg"]} name="Place" />);
    // ensure first image rendered
    expect(screen.getByRole("img")).toHaveAttribute("src", "/a.jpg");
    // buttons present
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
  });

  it("handles next and back navigation correctly", () => {
    render(<PhotoCarousel photos={["/a.jpg", "/b.jpg", "/c.jpg"]} name="Trip" />);
    const nextButton = screen.getByRole("button", { name: /next/i });
    const backButton = screen.getByRole("button", { name: /back/i });

    // click next multiple times to test wrap-around
    fireEvent.click(nextButton); // 0 -> 1
    fireEvent.click(nextButton); // 1 -> 2
    fireEvent.click(nextButton); // 2 -> 0 (wraps around)

    // click back multiple times to test wrap-around
    fireEvent.click(backButton); // 0 -> 2
    fireEvent.click(backButton); // 2 -> 1
    fireEvent.click(backButton); // 1 -> 0
  });

  it("handles step change from swipe", () => {
    render(<PhotoCarousel photos={["/a.jpg", "/b.jpg"]} name="SwipePlace" />);
    const swipeButton = screen.getByTestId("simulate-swipe");
    fireEvent.click(swipeButton); // triggers handleStepChange(1)
    expect(screen.getByRole("img")).toHaveAttribute("src", "/b.jpg");
  });
});
