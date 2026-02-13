# Spec: UI/UX Improvements

## MODIFIED Requirements

### Requirement: System Theme Preference Persistence
The theme picker must preserve the literal "system" selection and respond to OS-level theme changes in real time.

#### Scenario: User selects "System" theme
- **GIVEN** a user selects "System" in the theme picker
- **WHEN** the selection is saved
- **THEN** localStorage must store `"system"` (not the resolved `"dark"` or `"light"` value)

#### Scenario: OS theme changes while "System" is selected
- **GIVEN** the user's theme preference is `"system"` and the OS is in light mode
- **WHEN** the OS switches to dark mode
- **THEN** the app must immediately apply the dark theme CSS class via a `matchMedia` listener

#### Scenario: Reopening the theme picker
- **GIVEN** the user previously selected "System"
- **WHEN** the theme picker is opened again
- **THEN** the "System" option must be shown as the active selection

### Requirement: Graceful Handling of Deleted Agent Favorites
The favorites panel must not crash when a favorited agent has been deleted from the system.

#### Scenario: Favorited agent no longer exists
- **GIVEN** a user has agent "X" in their favorites and agent "X" is deleted by an admin
- **WHEN** the favorites panel loads and queries agent "X"
- **THEN** the query must catch the 404 error and return `{ found: false }` instead of throwing

#### Scenario: Mix of valid and deleted favorites
- **GIVEN** a user has 3 favorited agents, 1 of which has been deleted
- **WHEN** the favorites panel renders
- **THEN** the 2 existing agents must render normally and the deleted agent must be silently excluded

## MODIFIED Requirements

### Requirement: MCP Server Builder Dialog Accessibility
MCP Server Builder dialogs must meet WCAG accessibility standards with proper ARIA attributes, semantic grouping, and keyboard navigation.

#### Scenario: Form validation error announcement
- **GIVEN** a user submits the MCP server form with an invalid field
- **WHEN** the validation error appears
- **THEN** the error message must have `role="alert"` and the input must have `aria-invalid="true"` with `aria-describedby` pointing to the error element

#### Scenario: Radio group keyboard navigation
- **GIVEN** the auth type radio group is focused
- **WHEN** the user presses arrow keys
- **THEN** the radio group must be wrapped in a `fieldset` with `legend` and `aria-labelledby` for screen reader context

#### Scenario: Copy redirect URI
- **GIVEN** the OAuth redirect URI is displayed in a dialog
- **WHEN** the user clicks the copy button
- **THEN** the icon must toggle to a checkmark confirmation and the URI must be copied to clipboard

### Requirement: Image Preview Modal Visibility
The image preview modal must appear above all other UI layers.

#### Scenario: Opening image preview while side panel is open
- **GIVEN** the right side panel is visible with a high z-index
- **WHEN** the user clicks an image to preview
- **THEN** the preview overlay and content must render at `z-index: 250` (above side panel elements)

### Requirement: Chat Links Open in New Tabs
Links rendered in chat messages must each open in a separate browser tab.

#### Scenario: Clicking multiple links in a message
- **GIVEN** a chat message contains 3 hyperlinks
- **WHEN** the user clicks each link sequentially
- **THEN** each link must open in a new tab (`target="_blank"`), not reuse the same secondary window
