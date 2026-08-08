# Professional B2C UI Redesign — Tasks

- [ ] 1. Foundation: design tokens
  - [ ] 1.1 Create `src/constants/designTokens.js` with color palette and semantic typography scale from design.md
  - [ ] 1.2 Update `tailwind.config.js` `theme.extend` with primary/success/danger/warning colors and Inter font family
  - [ ] 1.3 Add Google Fonts Inter `<link>` to `public/index.html`
  - [ ] 1.4 Create `src/theme.js` MUI theme matching the same palette; wrap `<App/>` with `ThemeProvider` in `src/index.js`

- [ ] 2. Shared component library (`src/components/common/`)
  - [ ] 2.1 `Button.js` (primary/secondary/ghost/danger × sm/md/lg)
  - [ ] 2.2 `Card.js` (`PageCard`)
  - [ ] 2.3 `Badge.js` (success/warning/neutral/danger pills)
  - [ ] 2.4 `EmptyState.js`
  - [ ] 2.5 `PageContainer.js`
  - [ ] 2.6 `src/utils/notify.js` toast helper (success/error/info) using existing `react-toastify`

- [ ] 3. Remove native alert/placeholder content
  - [ ] 3.1 Replace `alert(...)` in `PaperView.js` with `notify.error`
  - [ ] 3.2 Remove placeholder `getChannelDetailsJSXBox` div in `ChannelHome.js`, replace with `EmptyState` or real content per design.md
  - [ ] 3.3 Grep for other literal `...` className strings and unfinished placeholder text across `src/js/**`, fix each

- [ ] 4. Header restyle (affects all pages)
  - [ ] 4.1 Restyle `EducationalBridgeHeaderLargeScreen.js` with token colors, `Button`/`PageContainer`
  - [ ] 4.2 Restyle `EducationalBridgeHeaderSmallScreen.js` matching

- [ ] 5. QuestionSet page (`/`, `/questions`, `/papers`)
  - [ ] 5.1 Restyle table/list rows as card rows using `PageCard`
  - [ ] 5.2 Tags rendered via `Badge`
  - [ ] 5.3 "Solve" action via `Button`
  - [ ] 5.4 Empty/no-results state via `EmptyState`
  - [ ] 5.5 Apply same treatment to `QuestionSetSmallScreen.js`

- [ ] 6. Question detail & comments
  - [ ] 6.1 Restyle `GeneralQuestionView.js` layout with `PageContainer`/`PageCard`
  - [ ] 6.2 Restyle `QuestionComment.js` voting buttons and author line with token colors
  - [ ] 6.3 Apply same treatment to small-screen question view variants

- [ ] 7. Paper taking & results
  - [ ] 7.1 Restyle `PaperView.js` question status grid using `Badge` colors (answered/marked/untouched)
  - [ ] 7.2 Restyle countdown/timer banner with warning/danger tokens
  - [ ] 7.3 Restyle `PaperSubmissionView.js` score/analysis presentation with `PageCard`

- [ ] 8. Channel & creation forms
  - [ ] 8.1 Restyle `ChannelHome.js` (search box, channel list/grid)
  - [ ] 8.2 Restyle `NewChannelCreation.js`, `NewTagCreation.js` forms with MUI `TextField` under new theme
  - [ ] 8.3 Restyle `QuestionCreation.js` form layout (keep existing rich text editor integration untouched)
  - [ ] 8.4 Restyle `NewPaperPortal.js` form layout

- [ ] 9. Summary & static pages
  - [ ] 9.1 Restyle `UserQuestionSubmissionsSummary.js`, `UserPaperSubmissionsSummary.js` with `PageCard` list items
  - [ ] 9.2 Restyle `AboutUs.js` as a simple content page

- [ ] 10. Verification pass
  - [ ] 10.1 Manually load every route in browser, confirm no console errors, confirm visual consistency
  - [ ] 10.2 Confirm responsive (small-screen) variants still function
  - [ ] 10.3 Run `npm run build` to confirm no build errors introduced
