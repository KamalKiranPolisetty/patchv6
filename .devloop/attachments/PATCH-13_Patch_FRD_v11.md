# Patch — Self-Service Chatbot Requirements
---

## 1. Overview

Patch is a self-service chatbot designed for Discount Tire store associates. It provides an alternative self-service path to resolution directly from the associate's desktop, reducing Helpdesk call volume. Patch includes a Knowledge Base module that uses extracted troubleshooting text stored in category-based `.txt` files to provide smarter, context-aware troubleshooting assistance.

## 2. Goals & Objectives

- Reduce inbound Helpdesk call volume for common, well-supported issues.
- Provide store associates with a fast, guided, self-service troubleshooting experience.
- Maintain a searchable Knowledge Base of extracted troubleshooting text that the AI can reference.
- Capture every interaction in MongoDB so the business can measure adoption and effectiveness.
- Log escalation events for L2 / Trusted Experts when Patch cannot resolve an issue.

## 3. Technology Stack

- **Frontend / Application Framework:** Next.js
- **Data Store:** MongoDB (Users, Transactions, Knowledge Base metadata)
- **AI:** Ollama using the `gemma4:31b-cloud` model
- **Authentication:** Username, email, and password stored in MongoDB
- **External Integrations:** Internal user profile API for store name and location lookup

MongoDB must be used for:
- incident persistence
- conversation history
- knowledge base metadata
- retrieved knowledge base text references
- escalation details
- feedback information

Ollama with the `gemma4:31b-cloud` model must be used as the primary LLM runtime for troubleshooting response generation.

## 4. Access & Launch

- Patch is launched from a desktop icon labeled **Patch**.
- When the user clicks the Patch icon, the system opens the Patch login screen.
- Users must be able to **log in** using their **email** and **password**.
- Users must be able to **sign up** using their **username**, **email**, and **password**.
- Authentication is handled by verifying the credentials against the **Users** collection in MongoDB.
- If authentication succeeds, the user is logged into Patch.
- If authentication fails, the user must see a clear error message.

## 5. Main Page

- The header must display the logged-in user's **username**.
- If a username is unavailable, the header may display the email prefix as a fallback.
- The main page presents one issue category as a clickable card in Phase 1 scope:
  - **VDI**
- **Knowledge Base Status Indicator:** Each card must visually display whether troubleshooting text is available for that category in the Knowledge Base (for example, `KB Available` or `KB Missing`).
- The home page focuses on the active Patch experience with one production-ready VDI support tile.
- The landing experience should introduce the assistant as **Patch**.
- The welcome copy should reflect the Patch support experience directly, for example a message equivalent to:
  - `Welcome to the Discount Tire Information Center, {username}. My name is Patch. Let's get you taken care of.`

## 5.1 Main Application Layout

After login, the user remains on a single main page for the primary workflow.

The main page must support two UI states:

### Pre-chat / Landing State
Before the first user message is sent, the page must show:
- persistent top navigation
- welcome section
- a single VDI category tile
- chat input area

This state should feel like a guided landing workspace for starting troubleshooting.

Layout requirements:
- the landing welcome block should be centered within the main content container
- the greeting heading and helper text should align with the centered workspace layout
- the pre-chat welcome section, single category tile, and chat input should share the same centered container alignment
- the landing page should feel visually close to the provided reference: a centered assistant mark, strong welcome headline, one available support tile, and a bottom-anchored chat input

### Active Chat State
After the user sends the first message, whether a tile is selected or not:
- the page continues on the same route
- the UI must switch into a chat-focused layout
- the tile grid and pre-chat helper content must be hidden
- the conversation area must become the primary focus
- the selected tile context stays active if a tile was chosen
- the page must show conversation history, incident status, and incident actions
- the top navigation stays visible
- when a chat is active or resumed, the conversation area should display the current incident identifier, category, and status near the top of the chat panel

Active chat presentation requirements:
- the active conversation area should be centered in the main workspace and should visually align with the provided reference
- user messages should render as right-aligned chat bubbles using the Patch primary red treatment
- Patch assistant responses should render as left-aligned response cards with a white background, subtle border, rounded corners, and comfortable padding
- the Patch assistant avatar or mark should appear beside the assistant response card
- assistant troubleshooting steps should appear inside the response card as cleanly rendered Markdown with numbered lists, spacing, and readable line height
- when the assistant asks whether the issue is resolved, that follow-up should render as a dedicated decision panel attached to or directly beneath the assistant response
- the decision panel should visually separate the resolution question from the main response body
- positive resolution actions should use a green treatment such as `Yes, resolved`
- negative continuation actions should use a red treatment such as `No, still having issues`
- the chat input should remain anchored at the bottom while the conversation stack grows above it
- the overall active chat screen should feel like a guided troubleshooting workspace rather than a plain transcript

### New Chat
When the user clicks `New Chat`:
- reset the active chat session in the UI
- return the page to the pre-chat landing state
- show the single VDI category tile again
- create a new incident when the user sends the first message in that new chat
- keep the user on the main page
- if `New Chat` is clicked from any other page, Patch should navigate to `/` and open the pre-chat landing state
- the `New Chat` action must work from the persistent header on every page where the header appears

### Header Navigation
The main page must use a persistent top navigation bar.

The navigation bar must contain:
- left side: Patch logo and app name
- right side: welcome message showing the logged-in user's username, followed by `Incidents`, `New Chat`, and `Logout`

Clicking the Patch logo or app name returns the user to the main page.

If the username is unavailable, the welcome message may display the email prefix as a fallback.

Clicking `New Chat` from the header should always produce a usable result:
- on the main page, it resets the current chat UI to the pre-chat landing state
- on any other page, it navigates to the main page and opens the pre-chat landing state

`Incidents` opens the incident list page.
`New Chat` resets the current chat UI to the pre-chat landing state without navigating away.
`Logout` signs the user out.

- The primary header actions are presented in the top navigation rather than repeated in the main page body.
- `Logout` should appear after `New Chat` in the header action order.

The standard workflow uses the unified main workspace experience rather than a separate dedicated `/chat` page.

## 6. Knowledge Base Management

Patch uses curated Knowledge Base text as the source for troubleshooting during normal application use.

Requirements:
- Troubleshooting knowledge is stored in the Knowledge Base as extracted plain-text `.txt` files.
- The Knowledge Base structure should support additional categories over time without changing the core chat experience.
- The requirements file is the source of the extracted troubleshooting content to be placed into those Knowledge Base `.txt` files.
- The application must retrieve troubleshooting content from the stored `.txt` files in the Knowledge Base folder.
- Knowledge Base text files stay available for future chats.
- Knowledge Base availability by category must drive the category tile status indicator.

### 6.1 Where To Paste Extracted Text

For now, extracted troubleshooting text should be pasted directly into this requirements file under a dedicated source-text subsection.

Storage mapping:
- Source pasted here under `VDI Knowledge Base Source Text`
- Target file to be created by the system: `knowledge_base/VDI/vdi.txt`

Instructions:
- Paste the extracted VDI troubleshooting text directly under `6.2 VDI Knowledge Base Source Text`
- Keep the content in plain text so the system can copy it into `knowledge_base/VDI/vdi.txt`
- If additional VDI knowledge is added later, append it below the existing text.
- If multiple VDI knowledge entries are pasted into the same section, separate them with a divider line such as `---`
- The system should treat the full text in that section as the source content for the VDI Knowledge Base file

### 6.2 VDI Knowledge Base Source Text

Target output file:
- `knowledge_base/VDI/vdi.txt`

Current extracted text:

```text
Knowledge Article: VDI - Basic Troubleshooting
Are you processing a payment?
If they answer Yes, we are going to open a ticket (proceed to opening a ticket as a Pri. 3, Impact 3, Urgency 1). This ticket needs to be labeled differently (not VDI).
Category: Software
Sub-category: Performance
Configuration Item: GK POS
Short description: POS payment issue
If they answer No, proceed to step 1 as detailed below.
I can help you get your VDI working again. Let’s try a couple of quick steps.
Sometimes it just needs a quick reset.
Step 1 - Log off the POS and reset the VDI
Steps
1. From the GK POS screen, go to the top-left corner and click the three-line Menu (☰).
2. Select Log Off.
If you have two sessions running, log off the second session as well.
3. You will be returned to the VDI screen.
4. Find the yellow key symbol with the words LOG OUT on the VDI desktop and double-click it.
This completes a proper logoff from the machine, clearing the active user session.
5. From the Windows desktop, search for Windows App in the search box (bottom left corner) on your computer and click the application.
6. Sign in to the VDI.

Did that resolve your issue?
If no, still not working...
I can try one more step from my end - I will force a logoff of the VDI session. This may take a few moments. Can you confirm whether this is for your VDI or someone else's?
No, it’s for someone else (proceed with opening a ticket)
Yes, it’s for me.
I will force a logoff of the VDI session. Please hold for a moment while I complete this step. I will let you know when you can try logging back into your VDI.
(After the API is run to disconnect the host session)
You should be all set. Go ahead and try logging back into your VDI.
Did that resolve your issue? Ticket should be opened with
Category: Software
Subcategory: Data problem
Config item: Azure Virtual Desktop or Store VDI
If no, still not working...
Thanks for working through those steps with me.
It looks like you need additional support, so I’m opening a ticket with a trusted expert to investigate further. Your ticket number is: INC123456. If you would like to check the status of this ticket, you can view it anytime from the home page under My Incidents. Thank you - we will work to resolve this as quickly as possible.
```

For every user message, Patch must retrieve extracted troubleshooting content before generating a response.

Scenario 1: Tile selected
- If the user selects a tile and sends a message:
  - use the selected tile as the active category
  - Patch may send a starter user message tied to that category, for example: `I have a problem with my {category}`
  - if a tile-triggered starter message is used, it counts as the first user message for the incident flow
  - retrieve knowledge base text only for that category
  - search extracted text only within that category
  - send the most relevant extracted troubleshooting content to the LLM
  - the LLM must convert the grounded troubleshooting answer into clean Markdown before returning it
  - generate a conversational troubleshooting response grounded in that knowledge base text
  - the LLM response must be accurate, specific to the retrieved troubleshooting content, and should avoid unsupported or guessed instructions

Scenario 2: No tile selected
- If the user sends a message without selecting a tile:
  - search the available Knowledge Base text
  - retrieve the most relevant extracted troubleshooting content
  - structure the retrieved context before sending it to the LLM
  - each retrieved context entry should include:
    - category
    - knowledge base text file name or reference
    - extracted text snippet
  - send the retrieved context to the LLM in a structured format
  - the LLM must convert the grounded troubleshooting answer into clean Markdown before returning it
  - answer conversationally using grounded troubleshooting instructions
  - if no strong knowledge base match is found, ask a short clarifying question before continuing

Examples:
- VDI selected -> search only VDI knowledge base text
- No tile selected -> search available knowledge base text

## 7. MongoDB Persistence

Every Patch chat session must create and update a corresponding incident record in the **Patch Transactions** collection in MongoDB.

MongoDB persistence must include:
- incident status
- conversation history
- selected or inferred category
- retrieved knowledge base file references
- retrieved troubleshooting context references
- escalation details
- resolution details
- feedback data
- timestamps for incident lifecycle events


## 7.0 Incident Pages

Patch must include:

1. An Incidents List Page
- shows all incidents for the signed-in user
- supports filters for `All`, `Open`, `Escalated`, and `Resolved`
- each incident includes a `View` action that opens its detail page
- active chat continuation is handled from the incident detail page

2. A Single Incident Detail Page
- Incident Header
- Status Badge
- Incident Timeline
- Full Conversation History
- Incident Details
- Escalation Information
- Resolution Information
- Feedback Information
- Incident Actions

Incident detail page requirements:
- the page should use a structured support-dashboard style layout
- conversation history and timeline should be clearly separated from metadata panels
- incident details, escalation details, resolution details, and feedback should appear in distinct cards or sections
- incidents in `Open` status should show a prominent `Resume Chat` action
- incidents in `Escalated` or `Resolved` status should show their final-state information and feedback area
- escalated incidents should show a visible escalation banner
- escalated incidents should show updated incident details clearly, including incident number, status, category or type, description, created-for, created date/time, escalation reason, priority, urgency, impact, and assignment details
- resolved incidents should show a visible read-only resolved banner
- resolved incidents should show updated incident details clearly, including incident number, status, category or type, description, created-for, and created date/time
- incident actions should appear in a predictable location near the incident header

Incident Timeline requirements:
- the timeline shows status progression only
- the timeline highlights milestone changes rather than full message-by-message activity
- the timeline may contain only these status milestones:
  - `Open`
  - `Escalated`
  - `Resolved`
  
- each timeline item must show:
  - status
  - timestamp
  - actor

### 7.1 Transaction Creation

An incident record is created when the first user message is sent.

When the user sends the first message:

- Patch creates a new incident record with status `Open`
- initializes conversation history
- initializes incident timeline
- stores troubleshooting metadata

### 7.2 Category-specific values

| Option  | Category | Sub-category | Priority | Urgency | Impact |
| ------- | -------- | ------------ | -------- | ------- | ------ |
| VDI     | Software | VDI          | 5        | 3       | 3      |

### 7.3 Transaction Update (on flow completion)

At the end of the troubleshooting flow, Patch updates the status to one of the following values only:

- **Open** — `lastupdatedby` = **Patch**
- **Escalated** — `lastupdatedby` = **Patch**
- **Resolved** — `lastupdatedby` = either **Patch** or **Escalation Team**

These three values are the only valid incident status values for the incident timeline and incident state.


## 8. Conversation Flow

1. User logs into Patch.
2. User sees the main page with the support tile and chat on the same page.
3. Knowledge Base text is already available for retrieval.
4. User may select a tile and send a message, or send a message without selecting a tile.
5. If the tile interaction triggers a starter message such as `I have a problem with my {category}`, that starter message is treated as the first user message.
6. Patch creates an incident only when the first message is sent.
7. Patch analyzes:
   - user intent
   - full stored conversation history for the active incident
   - selected troubleshooting category if available
   - the last troubleshooting step already reached in the conversation
8. Patch retrieves the most relevant extracted troubleshooting text from the Knowledge Base `.txt` files.
9. Patch must load the active incident conversation history from MongoDB before generating every new response.
10. Patch continues the existing troubleshooting flow and restarts only when:
   - the user explicitly starts a new issue
   - the user clicks `New Chat`
11. If the tile is selected, search that category's Knowledge Base text and retrieve the most relevant extracted troubleshooting content.

12. If no tile is selected, search the available Knowledge Base text and pass the retrieved context to the LLM in a structured format.
13. Patch sends both the retrieved knowledge base text context and the active incident conversation history to the LLM.
14. The LLM generates a grounded troubleshooting response using both the retrieved knowledge base text and the existing conversation state.
15. The LLM should answer conversationally while maintaining high accuracy and staying tightly grounded in the available troubleshooting context.
16. The LLM must return the troubleshooting answer in clean Markdown so steps, headings, bullets, tables, code-style identifiers, and emphasis are preserved consistently.
17. The chat UI must render the assistant Markdown response cleanly as formatted content rather than showing raw Markdown syntax.
18. Patch updates the incident conversation history after every user/assistant exchange.
19. Patch updates the incident timeline only when the incident status changes.
20. If the issue cannot be resolved, Patch must mark the incident as `Escalated`, persist escalation details, and display escalation information on the incident page.
21. If the issue is resolved, Patch marks the incident as `Resolved`, updates the incident details, and makes the incident read-only.
22. If the incident is `Open`, the user can continue the conversation later from the incident detail page.
23. If the incident is `Escalated` or `Resolved`, the incident detail page shows the final status, supporting details, and feedback experience.
24. User must be able to start a `New Chat` from the main page without deleting or resetting existing Knowledge Base text files.

### 8.1 Conversation Continuity Rules

Patch must maintain conversation continuity across all active incidents.

Rules:
- If the assistant asks a yes/no question, the next user answer must be interpreted relative to that question.
- If the assistant asks a follow-up selection question, the user's next short answer must be treated as the answer to that question, not as a brand-new conversation.
- Patch should continue from the identified category and current troubleshooting step when that context already exists in the active incident.
- For incidents in `Open`, resuming an incident must restore the prior context, category, and troubleshooting step.
- Escalated incidents should preserve the full troubleshooting history, escalation context, and final-state details for review.
- Resolved incidents stay available in a read-only review state after completion.

### 8.2 Dynamic Response UI

Patch must support LLM-driven response controls inside the chat experience.

Requirements:
- Based on the user message, retrieved troubleshooting context, and current incident state, the LLM should determine when the next step is better presented as structured UI instead of free-text-only chat.
- The LLM should be able to identify and return probable response options when the user should choose from a short set of likely answers.
- The LLM should be able to identify when a binary confirmation is needed and return `Yes` / `No` response options.
- The LLM should be able to identify when structured data entry is needed and return the fields required to render an input form.
- The frontend must render the returned response controls directly in the chat UI for the active assistant message.
- Supported response controls must include:
  - yes/no buttons
  - probable option buttons for short suggested replies
  - structured input forms when the assistant needs specific field values
- Probable options must be generated from the current troubleshooting step and assistant prompt, not shown as static hardcoded choices unrelated to the conversation.
- Structured forms must be used when the assistant needs clearly labeled values such as identifiers, configuration details, or repeated field sets.
- When the user clicks an option button, that selection must be sent back as the next user message in the conversation.
- When the user submits a structured form, the entered values must be converted into the next user message in a consistent structured format.
- Dynamic response controls must be tied to the active assistant prompt so the current troubleshooting step always presents the relevant interaction options.
- Resolution-check interactions should support the dedicated two-choice decision UI shown in the reference, with a green positive action such as `Yes, resolved` and a red negative action such as `No, still having issues`.
- Patch must still support normal typed responses even when dynamic response controls are shown, unless the step explicitly requires structured input.
- The meaning of the selected option or submitted form must be preserved in incident history so later steps can interpret the response correctly.

## 9. End-of-Flow Messages

### 9.1 Escalation (Patch could not resolve)

Display:

"I wasn't able to resolve the issue. I'm escalating this to our Trusted Experts for hands-on support."

Status:
- `Escalated`

When Patch cannot resolve an incident:
- Patch must change the incident status to `Escalated`
- Patch must persist escalation details in MongoDB
- Patch must record:
  - escalation state
  - escalation reason
  - assigned support group
  - escalation timestamp
  - updated priority, urgency, or impact if applicable
- the escalation information must be clearly visible on the Incident Page

Patch must prompt the user for final feedback after the incident is marked `Escalated`.

Escalation-related information may also come from Knowledge Base troubleshooting text and retrieved extracted text.

When an incident becomes `Escalated`:
- the active chat should show an escalation response card in the conversation area, visually similar to the provided reference
- the escalation response card should include a short Patch message explaining that the issue could not be resolved and that an incident has been created for L2 or trusted expert follow-up
- the escalation response card should include an embedded incident summary card directly in the chat
- the embedded incident summary card should show updated incident details such as:
  - incident number
  - incident type or category label
  - description or short description
  - created for
  - created date and time
  - current incident status
  - escalation reason
  - priority
  - urgency
  - impact
  - assignment or support group
- the embedded incident summary card should include a clear action that opens or redirects the user to the incident detail page
- the embedded incident summary card should visually reflect the `Escalated` status badge
- the incident page should display the escalation outcome clearly
- Patch must preserve all prior troubleshooting context for incident history and review
- the incident remains accessible from the incidents page through `View`
- the feedback experience should be available on the incident detail page

### 9.2 Resolution (Patch resolved the issue)

Display:

"Glad I was able to help you resolve the issue! Here are the ticket details for your records."

Status:
- `Resolved`

When an incident becomes resolved:
- the active chat should show a resolved response card in the conversation area, visually aligned with the provided reference
- the resolved response card should include a short Patch message confirming that the issue was resolved and that the incident details are shown for the user's records
- the resolved response card should include an embedded incident summary card directly in the chat
- the embedded incident summary card should show updated incident details such as:
  - incident number
  - incident type or category label
  - description or short description
  - created for
  - created date and time
  - current incident status
- the embedded incident summary card should include a clear action that opens or redirects the user to the incident detail page
- the embedded incident summary card should visually show a green resolved status treatment
- the resolved response card should place the feedback experience directly beneath the incident summary card
- chat input must be disabled
- the incident becomes viewable in read-only mode

Patch must prompt the user for final feedback after the incident is marked `Resolved`.
The page should display:
- `This incident is resolved.`

Resolved incident behavior:
- once an incident is marked `Resolved`, the incident is complete and available for review
- a different issue begins through `New Chat` after resolution

## 10. Feedback

Patch must collect feedback only at the end of an incident flow.

Feedback must be requested only when the incident reaches one of these final states:
- `Resolved`
- `Escalated`

Requirements:
- Prompt: **"How was your experience with Patch?"**
- Rating: 1–5 stars, persisted in the Patch transactions collection
- Written feedback comments are optional and should follow the screenshot pattern.
- Submission rule: the user can submit feedback after selecting a rating; written comments may be included optionally
- Feedback stays associated with the incident lifecycle
- Feedback is requested at final outcome rather than after each assistant reply
- Feedback must be shown once per incident after the final outcome is reached
- once feedback is submitted, the rating and written feedback should remain visible on the incident detail page
- In active chat for resolved and escalated outcomes, the feedback form should appear as a dedicated card beneath the incident summary card
- The feedback card should include a rating row, a text area for written feedback, and a submit action
- The feedback card should visually match the provided reference exactly, with clear spacing, soft borders, strong readability, and the same overall layout pattern.

## 11. Resume Chat And New Chat

Patch must support viewing all incidents and resuming active incidents from their detail pages.

Incidents List:
- The incidents list shows a `View` action for every incident.
- Clicking `View` opens the incident detail page.
- The incidents list should also display incident age in a human-readable format.

Resume Chat:
- On the incident detail page, incidents with status `Open` show a `Resume Chat` action.
- Clicking `Resume Chat` reopens that incident on the main page in active chat state.
- Previous messages for that incident must be restored from MongoDB in correct order.
- The assistant must continue from the last completed troubleshooting step.
- Category context should be restored if applicable.
- The landing-state tiles stay hidden while the resumed conversation is active.
- The header navigation stays visible.
- Patch must continue the active issue flow unless the user explicitly begins a different issue.

Escalated Incidents:
- Escalated incidents are available through the `View` action.
- The incident detail page shows escalation details, timeline, conversation history, and feedback.

Resolved Incidents:
- Resolved incidents are available through the `View` action.
- The incident detail page shows resolution details, timeline, conversation history, and feedback.

New Chat:
- Patch must provide a persistent `New Chat` action in the header navigation.
- Clicking `New Chat` must clear the current in-memory chat UI state only.
- Clicking `New Chat` preserves existing incidents and Knowledge Base text files.
- Clicking `New Chat` must return the page to the pre-chat landing state.
- The category tiles must be shown again.
- A new incident is created when the user sends the first message in the new chat.

## 12. Acceptance Criteria

- After login, user lands on a main page with tiles and chat on the same page.
- The landing page shows Patch branding.
- The landing page shows the available support tile for the current scope.
- The landing page focuses on the active Patch support experience with one available support tile and matches the intended reference style cleanly.
- Clicking a tile keeps the user on the main page.
- Sending the first message creates the incident.
- In active chat, the user message appears as a right-aligned red bubble and the Patch response appears as a left-aligned white response card.
- Assistant troubleshooting steps render as formatted Markdown inside the response card.
- When Patch asks if the issue is resolved, the UI shows a dedicated decision panel with a green positive action and a red negative action directly under the relevant assistant response.
- When Patch resolves an issue, active chat shows a resolved incident summary card with a green resolved status and the feedback card directly beneath it.
- Both escalated and resolved incident summary cards in active chat include updated incident details and a direct action that opens the actual incident detail page.
- With a selected tile, only that category’s Knowledge Base text is used for retrieval.
- Without a selected tile, the available Knowledge Base text is used for retrieval.
- `Incidents` is visible in the persistent header navigation.
- `New Chat` is visible in the persistent header navigation.
- `Logout` is visible in the persistent header navigation.
- The header action order on the right is `Incidents`, `New Chat`, then `Logout`.
- Primary navigation actions are presented in the header.
- `New Chat` resets the main page state without navigation.
- Every incident can be opened from the incidents list through a `View` action.
- The incidents list shows incident age for each incident.
- `Resume Chat` appears on the incident detail page for incidents in `Open` status.
- Resume Chat restores prior conversation context and continues the troubleshooting flow.
- After the first message is sent, the landing-state tiles and helper content are hidden and the page becomes chat-focused on the same main page.
- User can view all their incidents on the incidents page.
- Escalated incident detail pages show escalation information, conversation history, timeline, and feedback.
- Escalated incidents update and display reason, priority, urgency, impact, assignment, and current status consistently in storage, in active-chat summary cards, and on the incident detail page.
- When Patch escalates an issue in active chat, the conversation shows an incident-created summary card with updated incident details and a direct action to open the incident detail page.
- Resolved incident detail pages show resolution information, conversation history, timeline, and feedback.
- Feedback is requested only after an incident is `Resolved` or `Escalated`, not after every assistant reply.
- Users can sign up using their own username, email, and password.
- Users can log in using email and password.
- The header welcome message shows the signed-in user's username or email prefix if username is unavailable.
- When Patch cannot resolve an issue, the incident is marked `Escalated` and escalation details are shown on the incident page.
- Incident timeline shows only status milestones: `Open`, `Escalated`, and `Resolved`.
- Conversation messages stay in the conversation history while timeline events represent status milestones.
- Incident detail page uses clear visual sections for conversation, timeline, details, escalation, resolution, and feedback.
- When no tile is selected, retrieved Knowledge Base context is passed to the LLM in a structured format rather than as a single flat text blob.
- If no strong knowledge base match is found when no tile is selected, Patch asks a short clarifying question before continuing.
- When the LLM determines that the next troubleshooting step should use structured interaction, the chat UI renders dynamic controls such as yes/no buttons, probable options, or input forms for that assistant message.
- Assistant responses are returned as Markdown and rendered cleanly in the chat UI.
- The active chat, final-state cards, feedback cards, and incidents pages should match the intended screenshot-driven UI pattern with polished spacing, alignment, hierarchy, and state styling.

## Additional UX / Behavior Requirements

- The incidents list should use compact incident cards with clear spacing, rounded borders, and aligned metadata.
- Each incident card should show incident ID, category, created date, incident age, status badge, and primary action in a single easy-to-scan row.
- Status badges should use distinct colors by state:
  - `Open` -> yellow
  - `Escalated` -> red
  - `Resolved` -> green
- Primary actions such as `View`, `Resume Chat`, and `New Chat` should use consistent button styling across the application.
- Secondary actions should appear visually lighter than primary actions.
- Empty states should be centered and informative, with a clear next action such as `Start a New Chat`.
- Filter tabs on the incidents page should be visually grouped and clearly indicate the active state.
- Page content should align to a consistent max width for a focused, polished desktop reading experience.
- Forms and chat controls should align cleanly in a single row on desktop and stack neatly on mobile.
- The chat input bar should remain visually anchored and should feel like a persistent workspace control.
- On the incident detail page, `Resume Chat` should appear only for incidents in `Open` status.
- On the incidents list page, each incident should expose a clear `View` action for opening the detail page.
- long conversation history areas should support smooth scrolling without breaking the page layout
- important status and action controls should remain easy to access on desktop
- The chat input bar should remain anchored at the bottom of the main workspace in both landing and active chat states.
- On desktop, the input bar should sit near the bottom edge of the viewport rather than directly under the content when there is extra vertical space.
- The conversation area should use the remaining vertical space above the input bar.

## 13. Visual Design Direction

Patch should follow a clean enterprise support dashboard style similar to the provided reference image.

Visual direction:
- black header bar with white or light text, paired with a white main workspace
- red, white, black, and yellow should define the core visual palette
- minimal, professional, workspace-style layout with stronger hierarchy, cleaner spacing, and a polished production-ready finish
- persistent top navigation bar
- rounded cards and panels with light shadows and crisp borders
- primary accent color should be red for the Patch brand, key actions, and escalation states
- yellow should be used for `Open` states and attention-oriented UI
- green should be used for `Resolved` states
- typography should be clean and modern with strong readability and clear emphasis between titles, metadata, and helper text
- chat bubbles should feel structured and spacious rather than playful
- user chat bubbles should appear on the right in a strong Patch red treatment
- assistant responses should appear on the left in bordered white cards with generous padding
- assistant decision prompts such as resolution checks should appear as embedded follow-up panels beneath the assistant response card
- escalated outcomes should appear as an embedded incident-created card inside the assistant response flow, with updated incident details and a clear route to the incident page
- resolved outcomes should appear as an embedded incident summary card with a green resolved status treatment and the feedback card directly beneath it
- green and red action buttons should clearly communicate positive and negative resolution paths
- incident status cards, escalation banners, and action areas should feel prominent and easy to scan
- incident detail pages should use a structured two-column support dashboard layout on desktop
- conversation history, timeline, incident details, escalation information, resolution information, and feedback should appear in separate visual cards
- escalated incidents should show a high-visibility escalation banner
- resolved incidents should show a clear resolved/read-only banner
- the incident page should be visually stronger and easier to scan than a plain transcript layout
- the incidents list page should feel denser and more dashboard-like, with reduced empty whitespace on large screens
- the incidents list page should visually resemble the provided reference with summary status cards at the top and stacked incident cards below
- main content areas should use a centered container with a consistent max-width
- incident cards should prioritize horizontal scanning, with incident information on the left and status/actions aligned on the right
- incident cards should surface incident age alongside created date so recency is easy to scan
- empty states should feel intentional, with supportive copy and a clear call to action
- the landing page should visually connect the single category card and chat input as one guided workflow
- the main workspace should maintain strong alignment between header, content cards, and bottom input area
- status badges should use distinct visual treatments for `Open`, `Escalated`, and `Resolved`, with `Open` clearly yellow and `Escalated` clearly red
- primary and secondary actions should be visually differentiated so the most important next step is immediately clear
- desktop layouts should keep core content within a focused reading area with balanced whitespace
- the main page should use a full-height workspace layout where the content area expands and the chat input remains visually pinned near the bottom
- header content should use balanced alignment, with the logo on the left and the welcome message grouped with actions on the right
- the header branding should always use the name `Patch`
- landing-page content should feel visually centered and aligned within a single main workspace column
