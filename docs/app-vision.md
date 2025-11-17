# Name

- The app is called **ShelterSync**.

# Users

- **Frontline shelter volunteers** who need to share real-time information about beds, meals, and essential services.  
- **Individuals experiencing homelessness** who need fast, reliable updates on nearby shelters with available resources.

# Value proposition

A real-time, easy-to-use platform that helps shelters publish accurate availability and helps people in crisis quickly find open beds, meals, and services—reducing uncertainty and long, exhausting trips.

# Key features

ShelterSync provides a clean, mobile-first interface with two primary user modes: **Volunteer Mode** and **Guest Mode**.

## Volunteer Mode

A streamlined update interface for shelter staff and volunteers:

- **Instant bed availability updates** (e.g., open, limited, full).
- **Meal announcements** (e.g., “Dinner served until 8 PM”).
- **Service listings** (showers, medical vans, casework hours).
- **Urgent needs board** (e.g., “Need blankets”, “Low on socks”, “Hygiene kits needed”).

Simple operations:
- Select a category (Beds, Meals, Services, Urgent Needs).
- Enter or toggle the current status.
- Tap **Update** to instantly sync data across all users and shelters.

## Guest Mode (Individuals Seeking Help)

A map-first interface designed for quick decision-making:

- **Nearby shelters shown on a map** with color-coded availability (Open, Limited, Full).
- **Real-time bed counts** and meal/service updates.
- **One-tap walking directions** to the selected shelter.
- **View urgent needs** for those who may want to donate items.

Simple operations:
- Open app → see closest shelters.
- Tap a shelter to view details.
- Tap **Directions** for walking navigation.

# Example scenario

- Jordan volunteers at an overnight shelter. Guests frequently ask: *“Are there open beds?”*  
- Previously, Jordan checked handwritten notes and walked between rooms for updates.
- With ShelterSync, Jordan opens Volunteer Mode, selects **Beds**, and updates “5 Available.”  
  The change syncs instantly across all devices.
- A nearby individual opens Guest Mode and sees that a shelter 0.2 miles away has 5 open beds.
- They tap **Directions** and walk there directly—no more traveling to full shelters.
- Jordan now has more time to greet people, prepare spaces, and manage donations instead of constantly relaying updates.

# Coding notes

- Use **React** and **React Router** for mode switching (Volunteer vs. Guest).
- Use a **real-time backend** (Firebase, Supabase, or WebSockets) for syncing availability.
- Integrate with **Mapbox** or **Google Maps** for shelter locations and directions.
- Implement a simple auth flow for volunteers to prevent unauthorized updates.


# Testing notes

- **Unit tests**:
- Bed availability updates propagate correctly.
- Guest Mode displays only synchronized volunteer updates.
- Map component renders correctly and generates navigation links.
- Proper fallback when offline.

- **Integration tests**:
- Multi-shelter simultaneous updates.
- Volunteer authentication flow.

- **Usability tests**:
- Quick-decision scenarios (finding open beds fast).
- Low-connectivity and low-literacy scenarios.
