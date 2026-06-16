# Presidio Talent Hub - Development Guidelines

## Project Overview

**Project**: Presidio Talent Hub  
**Type**: Internal Web Application - Recruitment Management System  
**Technology Stack**: React, TypeScript, Vite, Tailwind CSS, React Router, Recharts  
**Status**: Production-Ready

## Project Structure

```
src/
├── pages/              # All page components (10 modules)
├── components/         # Shared layout components
├── types/             # TypeScript interfaces
├── data/              # Mock data
└── utils/             # Utility functions
```

## Key Features

- **10 Complete Modules**: Dashboard, Talent Acquisition, Campus Drive, Candidates, Assessments, Question Bank, Invitations, Shortlisting, Interviews, Reports
- **Enterprise UI**: Professional dashboard with charts and analytics
- **Presidio Branding**: Blue/white color scheme
- **Mock Data**: Comprehensive sample data for all entities
- **Responsive Design**: Mobile, tablet, and desktop support
- **TypeScript**: Full type safety

## Building & Running

### Development
```bash
npm run dev
# App runs at http://localhost:5173
```

### Production Build
```bash
npm run build
npm run preview
```

### Login Credentials
- Email: `rajesh.kumar@presidio.com`
- Password: `password`

## Code Standards

- **TypeScript**: Use strict types throughout
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS utility classes
- **Imports**: Use absolute imports from src/
- **Files**: One component per file in src/pages/ or src/components/

## Common Development Tasks

### Add New Page
1. Create file in `src/pages/NewPage.tsx`
2. Import Layout component
3. Add route in `src/App.tsx`

### Add Mock Data
Edit `src/data/mockData.ts` and export new data objects

### Update Types
Add interfaces to `src/types/index.ts`

## Configuration Files

- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript settings
- `tailwind.config.js` - Tailwind CSS theme
- `postcss.config.js` - PostCSS plugins

## Notes for Future Development

- All data is currently mock - integrate with backend API
- Authentication is simplified - implement real auth system
- Charts use sample data - connect to real data sources
- Responsive breakpoints: mobile (default), md (768px), lg (1024px)

## Troubleshooting

**Port in use**: `npm run dev -- --port 3000`  
**Build errors**: `npm ci && npm run build`  
**Module not found**: Ensure all imports use correct paths from src/

## Key Decisions

1. **Tailwind CSS**: Used for rapid, consistent styling
2. **React Router v6**: For simple, declarative routing
3. **Mock Data**: Enables complete demo without backend
4. **Tailwind v4 with @tailwindcss/postcss**: Latest Tailwind setup
5. **TypeScript Strict Mode**: Enabled for type safety
