import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StudyTimerProvider } from './context/StudyTimerContext';
import { Toaster } from 'sonner';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions,
) => {
  const { initialEntries, ...renderOptions } = options || {};

  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <StudyTimerProvider>
          <Toaster />
          {children}
        </StudyTimerProvider>
      </MemoryRouter>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
};

export * from '@testing-library/react';
export { customRender as render };
