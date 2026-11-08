import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { CardListing } from '@/entities/card/model/types';
import { CardPhotoMagnifierViewer } from './CardPhotoMagnifierViewer';

const offer = (id: string, photos = true): CardListing => ({ id, sellerId: id, sellerName: `Store ${id}`, name: 'Pikachu', game: 'Pokemon', image: '/cover.png', price: 500, cost: 0, stock: 1, status: 'SHOW', actualImageFrontUrl: photos ? `/${id}-front.png` : undefined, actualImageBackUrl: photos ? `/${id}-back.png` : undefined });
describe('actual photo gallery', () => {
  it('keeps official art separate and scopes actual photos to the selected seller', async () => {
    const user = userEvent.setup();
    render(<CardPhotoMagnifierViewer name="Pikachu" officialImage="/official.png" offers={[offer('a'), offer('b'), offer('c', false)]} />);
    expect(screen.getByAltText('Pikachu official art')).toHaveAttribute('src', '/official.png');
    await user.click(screen.getByRole('tab', { name: 'Actual Card Photos' }));
    expect(screen.getByAltText('Front actual card photo')).toHaveAttribute('src', '/a-front.png');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByAltText('Back actual card photo')).toHaveAttribute('src', '/a-back.png');
    await user.selectOptions(screen.getByLabelText('Photos from seller'), 'b');
    expect(screen.getByAltText('Front actual card photo')).toHaveAttribute('src', '/b-front.png');
    await user.selectOptions(screen.getByLabelText('Photos from seller'), 'c');
    expect(screen.getByText('This seller has not uploaded actual card photos.')).toBeInTheDocument();
    expect(screen.queryByAltText('Front actual card photo')).not.toBeInTheDocument();
  });
  it('provides explicit 2.5x zoom with keyboard position controls', async () => {
    const user = userEvent.setup();
    render(<CardPhotoMagnifierViewer name="Pikachu" officialImage="/official.png" offers={[offer('a')]} />);
    await user.click(screen.getByRole('tab', { name: 'Actual Card Photos' }));
    await user.click(screen.getByRole('button', { name: 'Zoom 2.5×' }));
    expect(screen.getByAltText('Front actual card photo')).toHaveStyle({ transform: 'scale(2.5)' });
    expect(screen.getByRole('slider', { name: 'Horizontal position' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Official Art' }));
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });
});
