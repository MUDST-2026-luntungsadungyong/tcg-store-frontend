import { forwardRef } from 'react';
import { Search } from 'lucide-react';
import { Input, type InputProps } from './Input';

export const SearchField = forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <Input ref={ref} type="search" icon={Search} aria-label="Search" {...props} />
));

SearchField.displayName = 'SearchField';
