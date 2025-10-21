import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('renders with small size', () => {
    render(<LoadingSpinner size="sm" />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toHaveClass('h-4', 'w-4');
  });

  it('renders with medium size', () => {
    render(<LoadingSpinner size="md" />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toHaveClass('h-8', 'w-8');
  });

  it('renders with large size', () => {
    render(<LoadingSpinner size="lg" />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toHaveClass('h-12', 'w-12');
  });

  it('renders with custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toHaveClass('custom-class');
  });

  it('renders with text', () => {
    render(<LoadingSpinner text="Loading..." />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with text and custom size', () => {
    render(<LoadingSpinner size="lg" text="Please wait..." />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toHaveClass('h-12', 'w-12');
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('applies correct animation classes', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'border-2');
  });

  it('applies correct border classes', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toHaveClass('border-gray-300', 'border-t-primary-600');
  });
});
