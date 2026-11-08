import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/model/useAuthStore";
import { profileApi } from "../api/profile";
import { ProfilePage } from "./ProfilePage";

vi.mock("@/features/collection/api/collection", () => ({ collectionApi: { getMyCollection: vi.fn().mockResolvedValue([]) } }));

vi.mock("../api/profile", () => ({ profileApi: { update: vi.fn(), uploadAvatar: vi.fn(), getAvatar: vi.fn() } }));

const user = {
  id: "user-1",
  name: "Guide",
  email: "guide@mythix.com",
  phone: "0918279608",
  line: "creatornaphat",
  facebook: "Naphat Phoruang",
  role: "USER" as const,
  isSeller: false,
};

describe("ProfilePage editors", () => {
  beforeEach(() => {
    localStorage.removeItem("mythix_profile_completion_dismissed_v1");
    vi.clearAllMocks();
    useAuthStore.setState({ token: "token", user, isHydrating: false });
    vi.mocked(profileApi.update).mockResolvedValue(user);
    vi.mocked(profileApi.getAvatar).mockResolvedValue(new Blob(["image"], { type: "image/png" }));
  });

  it("allows a complete profile to dismiss progress and remembers it on remount", async () => {
    useAuthStore.setState({ user: { ...user, avatarUrl: "https://example.com/avatar.png" } });
    const view = render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    await userEvent.click(screen.getByRole("button", { name: "Toggle profile completion details" }));
    await userEvent.click(screen.getByRole("button", { name: "Dismiss profile completion" }));
    expect(screen.queryByRole("button", { name: "Toggle profile completion details" })).not.toBeInTheDocument();
    view.unmount();
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("does not allow incomplete profiles to dismiss and clears a previous dismissal", async () => {
    localStorage.setItem("mythix_profile_completion_dismissed_v1", JSON.stringify([user.id]));
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Toggle profile completion details" }));
    expect(screen.queryByRole("button", { name: "Dismiss profile completion" })).not.toBeInTheDocument();
    await waitFor(() => expect(JSON.parse(localStorage.getItem("mythix_profile_completion_dismissed_v1") || "[]")).not.toContain(user.id));
  });

  it("reveals the floating details on hover and collapses on pointer leave", async () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    const interaction = userEvent.setup();
    const trigger = screen.getByRole("button", { name: "Toggle profile completion details" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Add Profile photo" })).not.toBeInTheDocument();
    await interaction.hover(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Add Profile photo" })).toBeVisible();
    await interaction.unhover(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("calculates completion from saved details and opens the missing contact editor", async () => {
    useAuthStore.setState({ user: { ...user, phone: " ", line: "", facebook: "" } });
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    expect(screen.getByRole("progressbar", { name: "Profile completeness" })).toHaveAttribute("aria-valuenow", "33");
    await userEvent.click(screen.getByRole("button", { name: "Toggle profile completion details" }));
    await userEvent.click(screen.getByRole("button", { name: "Add Phone" }));
    expect(screen.getByRole("dialog", { name: "Edit contact" })).toBeInTheDocument();
  });

  it("shows the missing photo prompt for a partially complete profile", async () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "83");
    await userEvent.click(screen.getByRole("button", { name: "Toggle profile completion details" }));
    expect(screen.getByRole("button", { name: "Add Profile photo" })).toBeInTheDocument();
  });

  it("shows 100 percent when all six details are filled", () => {
    useAuthStore.setState({ user: { ...user, avatarUrl: "https://example.com/avatar.png" } });
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("Your profile is complete")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Profile photo" })).not.toBeInTheDocument();
  });

  it("opens the profile editor in a modal and saves without routing away", async () => {
    const interaction = userEvent.setup();
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);

    await interaction.click(screen.getByRole("button", { name: "Edit profile" }));
    expect(screen.getByRole("dialog", { name: "Edit profile" })).toBeInTheDocument();

    await interaction.clear(screen.getByLabelText("Full name"));
    await interaction.type(screen.getByLabelText("Full name"), "Updated Guide");
    await interaction.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(profileApi.update).toHaveBeenCalledWith({ name: "Updated Guide", email: user.email }));
  });

  it("opens the contact editor in a separate modal", async () => {
    const interaction = userEvent.setup();
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);

    await interaction.click(screen.getByRole("button", { name: "Edit contact" }));
    expect(screen.getByRole("dialog", { name: "Edit contact" })).toBeInTheDocument();
    expect(screen.getByLabelText("Phone")).toHaveValue(user.phone);
  });

  it("shows the social profile with integrated contacts", () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Guide", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change profile photo" })).toBeInTheDocument();
    expect(screen.queryByText("Profile overview")).not.toBeInTheDocument();
    expect(screen.queryByText("Contact card")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit contact" })).toBeInTheDocument();
  });

  it("opens the photo editor before choosing a new file", async () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    const fileChooser = vi.spyOn(screen.getByLabelText("Choose profile photo"), "click");
    await userEvent.click(screen.getByRole("button", { name: "Change profile photo" }));
    expect(screen.getByRole("dialog", { name: "Update profile photo" })).toBeInTheDocument();
    expect(screen.getByText("Choose a photo to get started")).toBeInTheDocument();
    expect(fileChooser).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Upload new photo" }));
    expect(fileChooser).toHaveBeenCalledOnce();
  });

  it("loads the current avatar into the editor without choosing a new file", async () => {
    const loadSource = vi.fn();
    vi.stubGlobal("Image", class {
      naturalWidth = 512; naturalHeight = 512; onload: (() => void) | null = null;
      set src(value: string) { loadSource(value); queueMicrotask(() => this.onload?.()); }
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ clearRect: vi.fn(), save: vi.fn(), translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(), drawImage: vi.fn(), restore: vi.fn() } as unknown as CanvasRenderingContext2D);
    useAuthStore.setState({ user: { ...user, avatarUrl: "https://example.com/current.png" } });
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    await userEvent.click(screen.getByRole("button", { name: "Change profile photo" }));
    await waitFor(() => expect(loadSource).toHaveBeenCalledWith(expect.stringContaining("data:image/png;base64,")));
    expect(profileApi.getAvatar).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.getByRole("button", { name: "Save photo" })).toBeEnabled());
    expect(screen.getByText("Adjust your current photo")).toBeInTheDocument();
  });

  it("previews a photo, uploads on confirmation and refreshes the current user", async () => {
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:preview"), revokeObjectURL: vi.fn() }));
    vi.mocked(profileApi.uploadAvatar).mockResolvedValue({ ...user, avatarUrl: "https://example.com/avatar.png" });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ clearRect: vi.fn(), save: vi.fn(), translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(), drawImage: vi.fn(), restore: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => callback(new Blob(["cropped"], { type: "image/png" })));
    vi.stubGlobal("Image", class {
      naturalWidth = 800; naturalHeight = 600; onload: (() => void) | null = null;
      set src(_value: string) { queueMicrotask(() => this.onload?.()); }
    });
    const interaction = userEvent.setup();
    render(<StrictMode><MemoryRouter><ProfilePage /></MemoryRouter></StrictMode>);
    const file = new File(["image"], "avatar.png", { type: "image/png" });
    await interaction.upload(screen.getByLabelText("Choose profile photo"), file);
    expect(await screen.findByRole("img", { name: "Cropped profile photo preview" })).toBeInTheDocument();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(profileApi.uploadAvatar).not.toHaveBeenCalled();
    await interaction.click(screen.getByRole("button", { name: "Save photo" }));
    await waitFor(() => expect(useAuthStore.getState().user?.avatarUrl).toBe("https://example.com/avatar.png"));
    expect(profileApi.uploadAvatar).toHaveBeenCalledWith(expect.objectContaining({ name: "profile-photo.png", type: "image/png" }));
    expect(screen.getByRole("progressbar", { name: "Profile completeness" })).toHaveAttribute("aria-valuenow", "100");
  });

  it("rejects oversized photos before uploading", async () => {
    const interaction = userEvent.setup();
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" });
    await interaction.upload(screen.getByLabelText("Choose profile photo"), file);
    expect(screen.getByRole("alert")).toHaveTextContent("up to 5 MiB");
    expect(profileApi.uploadAvatar).not.toHaveBeenCalled();
  });

  it("replaces the seller CTA with a pending status after an application is submitted", () => {
    useAuthStore.setState({ user: { ...user, sellerStatus: "PENDING" } });
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: "Seller application pending" })).toBeInTheDocument();
    expect(screen.queryByText("Become a seller")).not.toBeInTheDocument();
  });
});
