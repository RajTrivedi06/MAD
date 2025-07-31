# RA Finder Feature

The RA Finder feature helps students discover research assistant opportunities that match their interests and skills.

## Features

- **Interest-based Search**: Enter research interests to find matching labs
- **Profile-based Recommendations**: Get personalized recommendations based on your academic profile
- **Fit Score**: See how well you match with each research opportunity
- **Lab Details**: View lab information, PI contact, and research areas
- **Why You Match**: Understand why each lab is recommended for you

## Current Implementation

The RA Finder feature currently displays mock data from `mockMatches.ts`.

## API Integration

Real API integration will replace the `setTimeout` in `handleSearch()` with an actual POST to `/api/ra-finder/search`, passing either:

- `{ keywords }` for keyword-based search
- `{ useProfile: true, userId }` for profile-based recommendations

The response will populate the same `LabMatch[]` interface. Loading states and error handling are already scaffolded via the `loading` state and skeleton cards.

## File Structure

```
src/features/ra-finder/
├── components/
│   ├── InterestForm.tsx    # Search form with keyword input and profile recommendation
│   ├── LabMatchCard.tsx    # Individual lab match display card
│   └── SkeletonCard.tsx    # Loading state skeleton
├── types/
│   └── labMatch.ts         # TypeScript interfaces
├── data/
│   └── mockMatches.ts      # Mock data for development
├── RaFinderPage.tsx        # Main page component
└── README.md               # This file
```

## Usage

Navigate to `/ra-finder` to access the feature.
