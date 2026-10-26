
# AI Mystery Room — Master Project Specification

Version: 2.1
Project Type: Full-Stack AI-Powered Mystery Investigation Website

---

## 1. Project Overview

AI Mystery Room is a full-stack web application where users can create and solve fictional mystery cases using artificial intelligence.

Users can write a short story or scenario, and the AI will transform it into an interactive investigation. The generated case will contain suspects, motives, evidence, witness statements, timelines, conversations, and a hidden culprit.

Players investigate the case by examining evidence, questioning suspects, connecting clues, developing theories, and finally accusing the person they believe is responsible.

After submitting their accusation, players receive a verdict explaining whether their answer is correct and how the evidence supports the solution.

The application must combine a complete full-stack web application with useful AI features. It must not be only a chatbot or a simple AI text generator.

The final website should be attractive, responsive, interactive, secure, and easy to use.

## 2. Main Objectives

The application must:

1. Allow users to create a mystery from their own story.
2. Provide ready-made mystery suggestions for users who need inspiration.
3. Generate structured investigation cases using Gemini AI.
4. Create suspects with different personalities, motives, and alibis.
5. Generate fictional evidence such as chats, emails, CCTV records, reports, and witness statements.
6. Maintain one consistent and logically valid solution for each case.
7. Allow players to investigate evidence and question suspects.
8. Provide tools for building timelines, theories, and evidence connections.
9. Allow players to submit a final accusation.
10. Calculate scores based on the accuracy of the investigation.
11. Store users, cases, progress, and results in MongoDB.
12. Provide an elegant, responsive interface with a light pastel theme.

## 3. Required Technology Stack

### Frontend
- React
- Vite
- Tailwind CSS
- JavaScript
- React Router
- Lucide React icons

### Backend
- Node.js
- Express.js
- JavaScript
- REST API architecture
- Zod for request and AI-response validation

### Database
- MongoDB
- Mongoose

### Artificial Intelligence
- Google Gemini API
- `@google/genai` package
- Structured prompts and validated JSON responses

### Deployment
- Frontend: Vercel
- Backend: A compatible Node.js hosting platform
- Database: MongoDB Atlas

Use compatible, stable package versions during implementation.

Keep the frontend, backend, database, and AI integration clearly separated.

## 4. User Roles

### Guest
- View the landing page.
- Explore the application features.
- Register or log in.

### Registered User
- Create a mystery from a custom story.
- Choose a ready-made mystery suggestion.
- Select a difficulty level.
- Investigate generated cases.
- Examine evidence and question suspects.
- Build theories and timelines.
- Submit accusations and view results.
- View saved cases and investigation history.
- Track progress, scores, and achievements.

### Backend System
- Validate requests.
- Generate mystery cases.
- Protect the canonical solution.
- Store and retrieve investigation data.
- Process interrogation requests.
- Validate verdicts and calculate scores.
- Prevent unauthorized access to private case information.

## 5. Main User Journey

The normal investigation flow should be:

1. The user opens the website.
2. The user registers or logs in.
3. The user opens the dashboard.
4. The user selects Create Mystery.
5. The user writes a custom scenario or selects a ready-made suggestion.
6. The user edits the scenario if required.
7. The user chooses a difficulty level.
8. The user clicks Generate Mystery.
9. The backend generates and validates the case.
10. The application displays the case introduction and investigation workspace.
11. The player examines suspects and evidence.
12. The player questions suspects and compares statements.
13. The player builds theories and reconstructs the timeline.
14. The player selects a culprit and submits the final accusation.
15. The backend evaluates the accusation and calculates the score.
16. The application displays the verdict, explanation, correct solution, and investigation results.
17. The result is saved to the user's history.

The application must clearly distinguish between creating a case and starting an investigation.

## 6. Pages and Navigation

### 6.1 Landing Page

Create an attractive homepage introducing AI Mystery Room.

Include:
- Application logo and name.
- Short and engaging introduction.
- Clear explanation of how the game works.
- Feature highlights.
- A visual preview of the investigation experience.
- Get Started and Login buttons.
- A simple navigation bar.
- A clean footer.

Do not display every application module in the navigation bar.

### 6.2 Register Page

Include:
- Name.
- Email.
- Password.
- Confirm password.
- Form validation.
- Password visibility control.
- Link to the login page.
- Clear success and error messages.

Passwords must be securely hashed before being stored.

### 6.3 Login Page

Include:
- Email.
- Password.
- Password visibility control.
- Form validation.
- Login button.
- Link to registration.

Protect private pages from unauthorized access.

### 6.4 Dashboard

The dashboard should give users a clear overview of their detective activity.

Include:
- Welcome message.
- Create Mystery button.
- Continue Investigation section.
- Recent Cases.
- Completed Cases.
- Total Cases Solved.
- Accuracy or average score.
- Recent achievements.
- Quick access to important investigation tools.

Use small, well-aligned cards and readable text. Avoid an overcrowded dashboard.

### 6.5 Create Mystery Page

This page is a major part of the application.

Users must be able to create a mystery using their own story or by selecting a ready-made mystery suggestion.

#### A. Custom Story Input

Display a heading such as:

"Create Your Mystery"

Show a short description:

"Have a story in mind? Describe it below, or choose an idea to get started."

Provide a large, clearly labelled text area.

Label:
"Describe your mystery"

Example placeholder:

"A priceless necklace disappears during a college cultural festival, and several people have different explanations."

The user should be able to enter, edit, and review their story before generating the case.

Include:
- Character or word limit.
- Input validation.
- Clear validation messages.
- Generate Mystery button.

#### B. Ready-Made Mystery Suggestions

Below the story input area, display a section titled:

"Need some inspiration?"

Description:

"Choose an idea to use as your starting story."

Display four visual mystery cards:

1. The Missing Necklace
   Description: A priceless necklace vanishes during a college festival.

2. The Locked Office
   Description: A confidential file disappears from a locked office.

3. The Midnight Alibi
   Description: Three guests give conflicting accounts of the same night.

4. The Exam Paper Leak
   Description: An upcoming exam paper appears online before the exam.

Each card must contain:
- A suitable image or illustration.
- Mystery title.
- Short description.
- "Use this idea" button.

Use a clean two-column card layout on suitable desktop screens and a single-column layout on smaller mobile screens.

The cards should have consistent spacing, rounded corners, readable text, and subtle hover effects.

Use suitable visual assets without making the page crowded.

#### C. Use This Idea Behavior

When the user clicks "Use this idea":

- Fill the story input area with the selected mystery scenario.
- Keep the user on the Create Mystery page.
- Do not generate the case immediately.
- Allow the user to edit the selected scenario.
- Allow the user to choose a difficulty level.
- Let the user click Generate Mystery when ready.

Selecting a suggestion must never automatically start an investigation.

#### D. Surprise Me Option

Provide a "Surprise Me" option near the ready-made suggestions.

When clicked:
- Randomly select one of the available ready-made mystery scenarios.
- Fill the story input area with that scenario.
- Allow the user to edit the selected story.
- Do not generate the case automatically.

The selection should be made from the available built-in suggestions without requiring a Gemini API call merely to display or select an idea.

#### E. Difficulty Selection

Provide three difficulty options:

- Easy
- Medium
- Hard

Display a short explanation of each difficulty.

Easy should have fewer suspects and clues. Medium should require more investigation. Hard should include more suspects, more evidence, and more complex contradictions.

#### F. Generate Mystery Behavior

When the user clicks Generate Mystery:

1. Validate the story input.
2. Validate the selected difficulty.
3. Send the scenario and difficulty to the backend.
4. Generate the case using the AI service.
5. Validate the generated case structure and logical consistency.
6. Save the case to the database.
7. Return safe case information to the frontend.
8. Open the investigation workspace.

Show a loading state while generation is in progress.

Display a useful error message if generation fails, and allow the user to retry.

Both custom stories and ready-made suggestions must use the same backend case-generation, validation, storage, and truth-protection pipeline.

### 6.6 Case Introduction Page

Display:
- Case title.
- Case summary.
- Incident type.
- Location.
- Date and time of the incident, where relevant.
- Difficulty.
- Number of suspects.
- Available investigation sections.
- Start Investigation button.

Do not reveal the culprit or hidden solution on this page.

### 6.7 Investigation Workspace

The investigation workspace is the main gameplay area.

Provide organized access to:
- Case Overview.
- Suspects.
- Evidence Vault.
- Suspect Interrogation.
- Timeline Reconstruction.
- Truth Graph.
- Detective's Theory Lab.
- Crime Scene Explorer.
- Evidence Confidence and Contradiction Analyzer.
- Final Verdict.

Use tabs, navigation panels, or clearly grouped sections rather than showing everything on one crowded screen.

Preserve investigation progress when the user switches between sections.

### 6.8 Final Verdict Page

After the accusation is submitted, display:
- Player's selected culprit.
- Correctness of the accusation.
- Selected motive and method, where applicable.
- Evidence supporting the correct solution.
- Explanation of important contradictions.
- Correct canonical solution.
- Final score.
- Hints used.
- Investigation accuracy.
- Play Again or Create Another Mystery option.

The hidden solution must be revealed only after the backend accepts the final accusation.

### 6.9 Profile and History Page

Include:
- User information.
- Completed investigations.
- Saved and active cases.
- Scores and accuracy.
- Achievements.
- Detective rank.
- Investigation history.

Users must only be able to access their own private data unless a feature explicitly allows shared access.

## 7. Difficulty and Scoring Rules

Use the following initial difficulty settings.

### Easy
- 3 suspects.
- At least 5 meaningful clues.
- 2 available hints.
- Base correct-culprit score: 100 points.

### Medium
- 4 suspects.
- At least 7 meaningful clues.
- 3 available hints.
- Base correct-culprit score: 150 points.

### Hard
- 5 suspects.
- At least 9 meaningful clues.
- 3 available hints.
- Base correct-culprit score: 200 points.

The backend must calculate scores.

Suggested scoring rules:
- Award the base score for correctly identifying the culprit.
- Award 5 points for each unique, relevant clue correctly identified.
- Deduct 10 points for each hint used.
- Award an optional reasoning bonus of up to 25 points for a well-supported explanation.
- Never allow the final score to fall below zero.
- Prevent duplicate clues from earning points repeatedly.
- Store the final score and relevant scoring details.

A wrong accusation should not receive the correct-culprit base score.

The score should reflect the player's investigation, not merely how quickly they click through the application.

## 8. Required Investigation Features

The following feature systems are required. Implement the core investigation features first and add the more advanced systems in later phases.

### 8.1 Truth-Locked Mystery Engine

This is the foundation of the application.

Responsibilities:
- Generate structured mystery cases.
- Establish one canonical solution for each case.
- Store the culprit, motive, method, timeline, and true events.
- Ensure the clues support the canonical solution.
- Ensure the case is solvable using available evidence.
- Prevent contradictions that make the case logically impossible.
- Keep the canonical solution on the backend.
- Provide safe, public case information to the frontend.

The engine must validate AI-generated output before it becomes an active case.

If the AI produces invalid JSON, missing suspects, unsupported clues, inconsistent timelines, or an incomplete solution, the backend should attempt a controlled repair or regeneration. If validation still fails, return a clear error rather than saving a broken case.

### 8.2 Evidence Vault

Create a central location for all evidence in a case.

Evidence types may include:
- Fictional WhatsApp-style conversations.
- Emails.
- CCTV-style records or video clips.
- Witness statements.
- Call logs.
- Photographs.
- Documents.
- Forensic reports.
- Location records.
- Digital activity records.

Each evidence item should include:
- Evidence title.
- Evidence type.
- Description or content.
- Timestamp, where relevant.
- Source.
- Related suspect or location.
- Reliability information.
- Discovered or undiscovered status, where appropriate.

Include search, filtering, and category selection.

Evidence must be fictional and consistent with the case. Clearly distinguish confirmed facts from unverified claims.

Do not present a fabricated AI-generated item as real-world evidence.

### 8.3 Suspect Interrogation

Allow players to ask suspects questions using a text input.

Each suspect should have:
- Name and profile.
- Personality.
- Motive.
- Known information.
- Alibi.
- Relationships.
- Relevant knowledge and limitations.

The backend should generate responses consistent with the suspect's established character and the canonical truth.

Suspects may lie, avoid questions, or give incomplete answers when appropriate. Their statements must not randomly change the established facts.

The system must not reveal the culprit simply because a player asks a direct question.

Store interrogation transcripts and provide access to previous conversations.

### 8.4 Timeline Reconstruction

Provide a chronological view of the incident.

Include:
- Important events.
- Event timestamps.
- Suspect movements, where relevant.
- Evidence linked to events.
- Conflicting statements.
- Missing or uncertain time periods.

Allow players to compare accounts and identify contradictions.

The backend should validate event relationships against the canonical timeline.

The interface should distinguish confirmed events from unverified claims and player-created assumptions.

### 8.5 Evidence-Based Verdict

Allow the player to submit a final accusation.

The accusation form should include:
- Selected culprit.
- Suspected motive.
- Suspected method, where applicable.
- Supporting evidence.
- Explanation of the player's reasoning.

The backend must evaluate the accusation against the canonical solution.

Calculate the score on the server, save the result, and reveal the correct explanation only after submission.

Do not trust a score, culprit identity, or solution supplied by the frontend.

### 8.6 Detective Career Mode

Provide a basic career and progress system first.

Include:
- Total cases attempted.
- Cases solved.
- Correct accusation rate.
- Average score.
- Total points.
- Detective rank.
- Achievements.

Possible ranks include:
- Trainee Detective.
- Junior Detective.
- Investigator.
- Senior Investigator.
- Master Detective.

Achievements should be awarded according to defined backend rules.

Leaderboards and shareable challenge links can be added after the core application works reliably.

### 8.7 Detective's Theory Lab

Allow players to create and manage their own theories.

Each theory should contain:
- Theory title.
- Suspected explanation.
- Related suspects.
- Supporting evidence.
- Contradicting evidence.
- Missing information.
- Notes.

Allow users to compare theories and update them during an investigation.

Clearly label theories as player hypotheses, not verified facts.

Never disclose whether a theory matches the hidden solution before the final verdict.

### 8.8 Truth Graph

Provide a visual investigation board that connects:
- Suspects.
- Evidence.
- Locations.
- Events.
- Motives.
- Important relationships.

Players should be able to create or remove connections and arrange items on the board.

Distinguish verified relationships from player-created hypotheses using labels or different visual styles.

The graph should be interactive, responsive, and understandable. Avoid excessive nodes or confusing connections.

### 8.9 Interactive Crime Scene Explorer

Provide a simple interactive 2D crime scene.

Include:
- A scene image or illustrated layout.
- Clickable hotspots.
- Evidence markers.
- Object descriptions.
- Locked or inaccessible objects where relevant.
- Links between discovered objects and the Evidence Vault.

Clicking a hotspot should reveal relevant information or evidence.

The crime scene must be connected to the current case rather than being a decorative image.

Start with a manageable 2D implementation. Advanced 3D graphics are not required.

### 8.10 Voice Interrogation

Add voice interaction as an enhancement after text-based interrogation works.

Include:
- Voice input for player questions.
- Spoken suspect responses where supported.
- Text transcript of the conversation.
- A text input fallback.
- Clear microphone permission and error handling.

Use browser speech capabilities where appropriate and compatible.

The application must remain fully usable if voice features are unavailable or permission is denied.

### 8.11 Multiplayer Detective Mode

Add multiplayer only after the single-player experience is stable.

Possible functionality:
- Create a private investigation room.
- Generate a room code.
- Join using a room code.
- Share case evidence discoveries.
- Collaborate on theories.
- Submit a team verdict.
- Display team investigation progress.

Use backend-controlled room access and permissions.

Prevent unauthorized users from joining private rooms or accessing hidden solutions.

Avoid implementing multiplayer before authentication, case generation, evidence handling, and verdict evaluation work correctly.

### 8.12 Evidence Confidence and Contradiction Analyzer

Provide an analysis panel that helps players evaluate evidence.

Include:
- Evidence reliability labels.
- Conflicting witness statements.
- Contradictions between statements and known events.
- Evidence supporting or weakening a theory.
- Missing evidence indicators.
- An explanation for each confidence label.

Use understandable labels such as:
- High confidence.
- Medium confidence.
- Low confidence.
- Unverified.

Explain why a piece of evidence receives its label.

Do not treat an AI-generated confidence score as a guaranteed probability of truth.

Distinguish clearly between:
- Verified facts within the fictional case.
- Claims made by suspects or witnesses.
- Player assumptions.
- AI-generated analytical suggestions.

The analyzer must not reveal the hidden culprit or solution before the verdict.

## 9. AI Case Generation Requirements

Use Gemini AI through the backend.

The AI should generate structured case data, including:
- Case title and summary.
- Incident details.
- Difficulty.
- Suspects and profiles.
- Motives and alibis.
- Canonical timeline.
- Evidence items.
- Witness statements.
- Relevant relationships.
- Interrogation knowledge constraints.
- Hidden canonical solution.
- Validated scoring information.

Use structured output and Zod validation where appropriate.

Do not depend on unstructured paragraphs for the entire case.

The backend must verify:
1. Required fields exist.
2. Suspect IDs are unique.
3. Evidence IDs are unique.
4. Evidence references valid suspects or events.
5. There is exactly one intended culprit.
6. The solution agrees with the timeline and evidence.
7. The difficulty requirements are satisfied.
8. The mystery is reasonably solvable.
9. No essential information is accidentally missing.
10. Public case data can be separated from secret solution data.

Use controlled retries for temporary AI failures or invalid responses.

If AI generation fails, show a useful error and allow the user to retry. Do not silently save an incomplete or inconsistent case.

## 10. Canonical Truth and Security Rules

These requirements are mandatory.

### 10.1 Protect the Solution

The culprit, full canonical timeline, hidden motives, and secret solution must remain on the backend until the player submits the final accusation.

Never send these details to the browser in:
- API responses.
- HTML.
- JavaScript variables.
- Hidden form fields.
- Client-side state.
- Browser storage.
- Public case JSON.
- Debug messages.

Hiding a field in the interface is not sufficient if the field has already been sent to the browser.

### 10.2 Backend Validation

The backend must:
- Validate request data.
- Check the authenticated user's access to a case.
- Validate evidence references.
- Calculate scores.
- Evaluate accusations.
- Control solution disclosure.
- Apply multiplayer room permissions.
- Prevent duplicate scoring and unauthorized result changes.

### 10.3 Controlled Interrogation

Suspect responses must follow the established case facts.

Provide the AI with only the information needed to produce an appropriate response, together with strict instructions not to disclose the hidden solution.

The backend must not accept arbitrary frontend instructions that override the canonical case.

### 10.4 API Key Protection

Store the Gemini API key in backend environment variables.

Never expose API keys in:
- React components.
- Vite public environment variables.
- Client-side JavaScript.
- Git repositories.
- Public configuration files.

Provide a `.env.example` file containing placeholder values only.

### 10.5 Authentication and Authorization

- Hash passwords securely.
- Protect private API routes.
- Verify case ownership.
- Validate IDs and request bodies.
- Use secure session or token handling.
- Configure CORS for the intended frontend.
- Apply reasonable request limits to expensive AI operations.
- Avoid returning stack traces or sensitive internal errors to users.

### 10.6 AI Output Safety

Treat generated text as untrusted input.

Validate and sanitize output before displaying it.

Render user and AI content safely. Do not execute generated HTML or JavaScript.

## 11. Database Design

Use MongoDB with Mongoose models.

Create models as needed for the following entities.

### 11.1 User

Suggested fields:
- name
- email
- passwordHash
- role, if required
- createdAt
- updatedAt

### 11.2 MysteryCase

Suggested fields:
- title
- originalScenario
- difficulty
- summary
- incidentDetails
- publicSuspects
- publicEvidence
- publicTimeline
- status
- createdBy
- createdAt
- updatedAt

Keep the canonical solution and other secret information separate from public case fields. Use a protected solution model or a clearly isolated private field that is never included in public API responses.

### 11.3 CaseSolution

Suggested fields:
- caseId
- culpritId
- canonicalMotive
- canonicalMethod
- canonicalTimeline
- secretFacts
- solutionExplanation
- createdAt

Only trusted backend logic should access this information before verdict submission.

### 11.4 Investigation

Suggested fields:
- userId
- caseId
- status
- discoveredEvidenceIds
- interrogationHistory
- playerTimeline
- theories
- hintsUsed
- score
- verdict
- startedAt
- completedAt

### 11.5 Evidence

Evidence may be stored as embedded case data or as a separate model, depending on the final implementation.

Suggested fields:
- caseId
- title
- type
- content
- source
- timestamp
- relatedSuspectIds
- reliability
- createdAt

### 11.6 Achievement

Suggested fields:
- name
- description
- condition
- points
- icon
- rank, where applicable

### 11.7 MultiplayerRoom

Add during the multiplayer phase.

Suggested fields:
- roomCode
- caseId
- hostUserId
- memberUserIds
- sharedProgress
- teamVerdict
- status
- createdAt

Use appropriate indexes for frequently searched fields, including email, case ownership, case IDs, and room codes.

Avoid duplicating large amounts of data without a clear reason.

## 12. Backend API Requirements

Use REST APIs with consistent JSON responses and appropriate HTTP status codes.

Exact route names may be adjusted during implementation, but the functionality below is required.

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout` if session-based authentication is used
- `GET /api/auth/me`

### User and Dashboard

- `GET /api/users/me`
- `GET /api/dashboard`
- `GET /api/users/me/history`

### Mystery Cases

- `POST /api/cases/generate`
- `GET /api/cases`
- `GET /api/cases/:caseId`
- `DELETE /api/cases/:caseId` when authorized and appropriate

The generation endpoint should accept the scenario and difficulty, validate the request, generate the case, validate the result, save it, and return only safe public case data.

### Investigation

- `POST /api/investigations`
- `GET /api/investigations/:investigationId`
- `PATCH /api/investigations/:investigationId`
- `GET /api/investigations/:investigationId/evidence`
- `POST /api/investigations/:investigationId/evidence/:evidenceId/discover`

### Interrogation

- `POST /api/investigations/:investigationId/interrogate`

The endpoint should validate the question, verify access, obtain the relevant suspect context, and return a response consistent with the canonical case.

### Timeline and Theories

- `GET /api/investigations/:investigationId/timeline`
- `PUT /api/investigations/:investigationId/timeline`
- `GET /api/investigations/:investigationId/theories`
- `POST /api/investigations/:investigationId/theories`
- `PATCH /api/investigations/:investigationId/theories/:theoryId`
- `DELETE /api/investigations/:investigationId/theories/:theoryId`

### Verdict and Scoring

- `POST /api/investigations/:investigationId/verdict`
- `GET /api/investigations/:investigationId/result`

The result endpoint must not reveal the solution before a valid final verdict has been submitted.

### Career and Achievements

- `GET /api/users/me/stats`
- `GET /api/users/me/achievements`

### Multiplayer

Add room creation, joining, shared progress, and team verdict endpoints during the multiplayer phase.

### API Standards

All endpoints must:
- Validate input.
- Check permissions.
- Return consistent JSON.
- Use suitable status codes.
- Handle missing records.
- Avoid exposing secret fields.
- Return understandable errors.

Do not return database documents containing private fields directly to the frontend.

## 13. Frontend Design and User Experience

The visual design is a major requirement.

The website must look clean, elegant, professional, peaceful, and modern.

### 13.1 Color Palette

Use the following light pastel palette:

- Warm Ivory: `#FAF8F4` — main page background.
- Soft Blush Pink: `#F4E8EC` — gentle highlights and selected cards.
- Powder Lavender: `#E8EAF5` — secondary panels.
- Sage Green: `#E6F0E8` — positive states and subtle accents.
- Buttercream: `#F8EFD9` — selected highlights.
- White: `#FFFFFF` — cards, forms, and content surfaces.
- Neutral gray tones — body text, borders, and secondary labels.

Use readable text colors with sufficient contrast.

Do not use dark backgrounds anywhere in the website. Avoid black, charcoal, navy, or deep plum sections and dark-filled primary buttons.

### 13.2 Typography

- Use a clean, readable font.
- Keep body text generally around 14–16px.
- Keep page headings moderate, generally around 24–30px.
- Use consistent font weights.
- Avoid oversized text and unnecessary decorative typography.
- Maintain a clear hierarchy between headings, labels, descriptions, and buttons.

### 13.3 Layout

- Use consistent spacing and alignment.
- Keep cards and forms visually balanced.
- Use a consistent content width.
- Ensure buttons, labels, and icons are aligned correctly.
- Prevent clipped text and icons.
- Avoid crowded sections and unnecessary empty space.
- Keep long evidence and interrogation content readable.
- Use clear loading, empty, success, and error states.

### 13.4 Navigation

Use a simple, consistent navigation system.

Show only the most important destinations in the main navigation. Group investigation tools within the investigation workspace.

Ensure active navigation states are clear.

Changing a tab or sidebar item must not unexpectedly scroll the page to the top or lose investigation progress.

### 13.5 Responsive Design

The website must work on:
- Desktop computers.
- Laptops.
- Tablets.
- Mobile phones.

Use responsive grids and flexible layouts.

Prevent horizontal overflow and clipped controls.

The ready-made mystery cards must adapt to screen width.

### 13.6 Accessibility

- Use semantic HTML.
- Label all form inputs.
- Provide keyboard navigation.
- Show visible keyboard focus.
- Provide alternative text for meaningful images.
- Do not communicate important states through color alone.
- Maintain sufficient contrast.
- Provide accessible names for icon-only buttons.

### 13.7 Interactions

Use JavaScript and React state for real interactions.

Buttons must perform their stated actions.

Forms must validate data and show feedback.

Use subtle hover and focus effects. Avoid excessive animations and distracting transitions.

## 14. Application Structure

Use a clean and maintainable project structure.

A suggested structure is:

```text
ai-mystery-room/
├── client/
│   ├── public/
│   │   └── images/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── mystery/
│   │   │   ├── evidence/
│   │   │   ├── interrogation/
│   │   │   ├── timeline/
│   │   │   ├── theories/
│   │   │   ├── verdict/
│   │   │   └── career/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   ├── ai/
│   │   ├── caseGeneration/
│   │   ├── investigation/
│   │   └── scoring/
│   ├── validators/
│   ├── utils/
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── .env.example
├── .gitignore
├── SPEC.md
└── README.md
```

This is a recommended structure, not a requirement to create every folder immediately. Create folders and files when they are needed for the current implementation phase.

Keep related code together and avoid unnecessary empty files.

## 15. Environment Configuration

Provide a `.env.example` file containing placeholder values such as:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
SESSION_SECRET=replace_with_a_secure_random_secret
```

Use the authentication approach selected during implementation. Remove unused environment variables.

Create a separate local `.env` file for actual development values.

Never commit `.env` to Git.

Document the required environment variables in the README.

## 16. Error Handling and Reliability

Handle common errors clearly.

Examples include:
- Invalid registration details.
- Incorrect login credentials.
- Expired or invalid authentication.
- Missing or inaccessible cases.
- Invalid story input.
- AI service unavailable.
- AI response validation failure.
- Database connection failure.
- Duplicate evidence discovery.
- Repeated verdict submission.
- Unauthorized room access.
- Voice permission denied.

Show user-friendly messages on the frontend.

Log useful diagnostic details on the backend without exposing secrets or private case information.

Provide retry options where appropriate.

Do not leave the interface stuck in a loading state after a failed request.

## 17. Testing Requirements

Test the application throughout development.

### Authentication
- Registration works.
- Duplicate email addresses are handled.
- Login validates credentials.
- Passwords are not stored as plain text.
- Protected routes reject unauthorized requests.

### Mystery Creation
- Custom scenarios can be submitted.
- All four ready-made suggestions are displayed.
- Each Use this idea button fills the input correctly.
- Surprise Me selects a suggestion.
- Selecting an idea does not automatically generate a case.
- Users can edit selected scenarios.
- Difficulty selection works.
- Empty or invalid stories are rejected.
- Loading and error states work.

### AI Generation
- Valid cases are generated.
- Invalid AI responses are rejected or safely retried.
- The case contains the required suspects and evidence.
- The solution is logically consistent.
- The generated case meets the selected difficulty.
- AI failures do not create broken saved cases.

### Investigation
- Evidence can be viewed and discovered.
- Search and filters work.
- Interrogation responses remain consistent.
- Timeline events can be examined.
- Theories can be created and edited.
- Graph connections behave correctly.
- Crime scene hotspots reveal the intended evidence.
- Voice features have a usable text fallback.

### Verdict and Scoring
- Correct accusations are evaluated correctly.
- Incorrect accusations do not receive the correct-culprit base score.
- Hint penalties are applied.
- Duplicate clues do not award repeated points.
- Scores are calculated by the backend.
- Results are saved.
- The solution remains hidden until the verdict is submitted.

### Security
- API keys are not exposed to the frontend.
- Private routes require authentication.
- Users cannot access other users' private cases.
- Public responses do not contain hidden solutions.
- Invalid requests are rejected.
- AI-generated content is displayed safely.

### User Interface
- Pages work on desktop and mobile.
- Text and icons are not clipped.
- No horizontal overflow occurs.
- Navigation works consistently.
- Forms and buttons have clear feedback.
- The light pastel design is applied consistently.
- Keyboard navigation and visible focus states work.

## 18. Implementation Order

Build the application in manageable phases.

### Phase 1: Project Setup and Design
- Create the React and Vite frontend.
- Configure Tailwind CSS.
- Set up the Express backend.
- Connect MongoDB.
- Configure environment variables.
- Create the shared visual design system.
- Build the landing page and basic navigation.

### Phase 2: Authentication and Dashboard
- Implement registration and login.
- Add secure authentication.
- Create protected routes.
- Build the dashboard.
- Add user statistics and case history foundations.

### Phase 3: Create Mystery Page
- Build the custom story input.
- Add the four ready-made mystery cards.
- Add the Use this idea behavior.
- Add Surprise Me.
- Add difficulty selection.
- Add input validation and loading states.
- Connect the page to the backend generation endpoint.

### Phase 4: AI Generation and Truth Protection
- Integrate Gemini on the backend.
- Create structured prompts.
- Validate generated JSON with Zod.
- Establish the canonical solution.
- Separate public case data from secret solution data.
- Save valid cases in MongoDB.
- Test that secret data never reaches the client prematurely.

### Phase 5: Core Investigation
- Build the case introduction page.
- Implement suspects and the Evidence Vault.
- Add search and filtering.
- Implement text-based interrogation.
- Add timeline reconstruction.
- Add final accusation and verdict evaluation.
- Implement backend scoring and result storage.

### Phase 6: Advanced Investigation Tools
- Add the Detective's Theory Lab.
- Add the Truth Graph.
- Add the Interactive Crime Scene Explorer.
- Add the Evidence Confidence and Contradiction Analyzer.
- Improve case consistency and investigation persistence.

### Phase 7: Career and Voice Features
- Add detective statistics.
- Add achievements and ranks.
- Implement voice input and spoken responses where supported.
- Keep text interrogation available at all times.

### Phase 8: Multiplayer
- Add room creation and joining.
- Add shared evidence and team theories.
- Implement team verdicts.
- Validate room membership and access permissions.

### Phase 9: Final Testing and Deployment
- Test all major user journeys.
- Fix layout, validation, and API errors.
- Check security and solution protection.
- Test responsive behavior.
- Configure production environment variables.
- Deploy the frontend and backend.
- Connect the production backend to MongoDB Atlas.
- Write complete setup and usage instructions.

Do not begin advanced features while the core application is broken. Each phase should be tested before moving to the next.

## 19. README Requirements

Create a README containing:
- Project overview.
- Main features.
- Technology stack.
- Project structure.
- Prerequisites.
- Installation instructions.
- Environment variable setup.
- How to run the frontend.
- How to run the backend.
- How to connect MongoDB.
- How to configure Gemini.
- Testing instructions.
- Deployment instructions.
- Known limitations, if any.

Explain setup commands clearly so another developer can run the project.

Do not include actual API keys, passwords, or connection secrets.

## 20. Final Deliverables

The completed project should contain:

1. A working React frontend.
2. A working Express backend.
3. MongoDB integration.
4. Secure authentication.
5. AI-powered mystery generation.
6. Ready-made mystery suggestions on the Create Mystery page.
7. A protected canonical solution.
8. An interactive investigation workspace.
9. An Evidence Vault.
10. Suspect interrogation.
11. Timeline reconstruction.
12. Evidence-based verdict and scoring.
13. Theory and graph tools.
14. Interactive crime scene exploration.
15. Evidence confidence and contradiction analysis.
16. Career statistics and achievements.
17. Voice interrogation with text fallback.
18. Multiplayer investigation as a later-phase feature.
19. Responsive light-themed UI.
20. Input validation and error handling.
21. Testing of the main workflows.
22. `.env.example` and `.gitignore`.
23. Complete README and setup instructions.

## 21. Definition of Done

The project is considered complete when:

- A user can register and log in.
- A user can create a mystery using their own scenario.
- A user can select a ready-made scenario or use Surprise Me.
- Selecting a suggestion fills the story input without automatically generating a case.
- A user can edit the scenario and select a difficulty.
- Gemini generates a structured, valid mystery.
- The case has one consistent canonical solution.
- The player can investigate suspects and evidence.
- The player can question suspects and examine contradictions.
- The player can submit a final accusation.
- The backend evaluates the accusation and calculates the score.
- The solution is protected until the verdict is submitted.
- Investigation results are saved in MongoDB.
- The main interface is responsive, clean, readable, and light-themed.
- Important errors are handled properly.
- The application can be run using the documented instructions.
- Core features are tested before advanced features are considered complete.

---

## Final Instruction to the Coding Agent

Read this SPEC.md before implementing the project.

Treat the requirements as the project's source of truth.

Build the application in the phases described above. Prioritize a working full-stack application with secure AI integration and a polished user interface.

Do not implement only static mockups. Buttons, forms, navigation, database operations, case generation, investigation actions, and verdict submission must work as described.

Do not expose the canonical solution to the frontend before verdict submission.

Keep the visual design light, pastel, organized, and professional. Never use dark backgrounds.

Implement the ready-made mystery suggestion cards and Surprise Me behavior as part of the Create Mystery page.

Do not generate every advanced feature at once. Build, test, and stabilize the core features first, then proceed to the advanced phases.

If a requirement is technically unclear, choose the simplest reliable implementation that preserves the intended behavior and document the decision.
