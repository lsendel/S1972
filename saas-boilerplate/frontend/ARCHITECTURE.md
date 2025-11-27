# Frontend Architecture

## Overview
The frontend is built with React 18, TypeScript, and Vite. It uses a component-based architecture with a clear separation of concerns between API communication, state management, and UI presentation.

## Directory Structure
- `src/api`: API client and endpoint definitions.
- `src/hooks`: Custom React hooks, primarily for data fetching and auth.
- `src/pages`: Page components corresponding to routes.
- `src/components`: Reusable UI components (shadcn/ui).
- `src/types`: TypeScript type definitions.
- `src/stores`: Global state stores (Zustand).

## State Management
- **Server State**: Managed by TanStack Query (React Query). Used for all API data.
- **UI State**: Managed by Zustand. Used for global UI state like sidebar toggle, modals.
- **Form State**: Managed locally or via React Hook Form (recommended for complex forms).
- **URL State**: Managed by React Router (search params).

## Authentication
- Session-based authentication using HTTP-only cookies.
- `useAuth` hook provides user data and login/logout methods.
- Axios interceptors handle CSRF tokens and 401 responses.

## Styling
- Tailwind CSS for utility-first styling.
- shadcn/ui for accessible, reusable components.

## Routing
- React Router v6.
- Protected routes using wrapper components (`RequireAuth`, `RequireOrg`).

## Next Steps
- Implement `Dashboard` and `Settings` pages.
- Create `RequireAuth` and `RequireOrg` wrappers.
- Integrate `shadcn/ui` components.
