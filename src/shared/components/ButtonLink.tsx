import { forwardRef } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { buttonClasses, type ButtonStyleProps } from './buttonStyles';

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonStyleProps['variant'];
  size?: ButtonStyleProps['size'];
}

/** Navigation with the shared button appearance and native link semantics. */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ variant, size, className, ...props }, ref) => (
    <Link ref={ref} className={buttonClasses({ variant, size, className })} {...props} />
  ),
);

ButtonLink.displayName = 'ButtonLink';
