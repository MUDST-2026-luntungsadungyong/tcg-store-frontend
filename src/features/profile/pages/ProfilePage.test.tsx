import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/model/useAuthStore";
import { profileApi } from "../api/profile";
import { ProfilePage } from "./ProfilePage";

vi.mock("../api/profile", () => ({ profileApi: { update: vi.fn() } }));

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
    useAuthStore.setState({ token: "token", user, isHydrating: false });
    vi.mocked(profileApi.update).mockResolvedValue(user);
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

  it("flips the synchronized profile business card to contact details", async () => {
    const interaction = userEvent.setup();
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);

    await interaction.click(screen.getByRole("button", { name: "Show contact side of business card" }));

    expect(screen.getByRole("button", { name: "Show name and email side of business card" })).toBeInTheDocument();
    expect(screen.getAllByText(user.line).length).toBeGreaterThan(0);
  });

  it("replaces the seller CTA with a pending status after an application is submitted", () => {
    useAuthStore.setState({ user: { ...user, sellerStatus: "PENDING" } });
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: "Seller application pending" })).toBeInTheDocument();
    expect(screen.queryByText("Become a seller")).not.toBeInTheDocument();
  });
});
